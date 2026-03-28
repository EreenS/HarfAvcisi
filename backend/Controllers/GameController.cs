using Microsoft.AspNetCore.Mvc;
using Google.Cloud.AIPlatform.V1;
using Google.Protobuf.WellKnownTypes;
using System.Text.Json;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    private readonly string _apiKey;

    // IConfiguration sayesinde ayarlara erişiyoruz
    public GameController(IConfiguration configuration)
    {
        _apiKey = configuration["Gemini:ApiKey"] ?? "";
    }

    [HttpPost("validate")]
    public async Task<IActionResult> ValidateAnswers([FromBody] GameRequest request)
    {
        // 1. Yardımcı bir fonksiyon: Anahtar yoksa boş string dönsün
        string GetSafeValue(string key)
        {
            return request.Answers != null && request.Answers.TryGetValue(key, out var value)
                   ? value
                   : "";
        }

        // 2. Gemini API endpoint hazırlığı (Artık "Google AI" üzerinden konuşuyoruz)
        string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        using var client = new HttpClient();

        // 3. Değerleri güvenli bir şekilde alalım
        string isim = GetSafeValue("isim");
        string sehir = GetSafeValue("sehir");
        string hayvan = GetSafeValue("hayvan");
        string bitki = GetSafeValue("bitki");
        string esya = GetSafeValue("esya");

        // 4. Prompt: AI'ya vereceğimiz talimat (sadece validations dönsün)
        string promptText = $@"
        Sen katı bir Harf Avcısı hakemisin. Seçilen harf: '{request.SelectedLetter}'.
        Kelimeler: İsim:{isim}, Şehir:{sehir}, Hayvan:{hayvan}, Bitki:{bitki}, Eşya:{esya}.

        SADECE şu formatta JSON dön:
        {{ ""validations"": {{ ""isim"": true, ""sehir"": false, ... }} }}";

        var requestBody = new
        {
            contents = new[] {
                new { parts = new[] { new { text = promptText } } }
            }
        };

        try
        {
            var response = await client.PostAsJsonAsync(url, requestBody);
            var result = await response.Content.ReadAsStringAsync();

            // Google AI cevabını parse et
            using var apiResponseDoc = JsonDocument.Parse(result);

            var candidates = apiResponseDoc.RootElement.GetProperty("candidates");
            string? aiText = candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (string.IsNullOrEmpty(aiText))
                return BadRequest("AI boş yanıt döndü.");

            // ```json ... ``` gibi işaretleri temizle
            string cleanJson = aiText.Replace("```json", "").Replace("```", "").Trim();

            // AI'dan gelen JSON'u parse et (sadece validations var)
            using var validationDoc = JsonDocument.Parse(cleanJson);
            var validationsElement = validationDoc.RootElement.GetProperty("validations");

            // PUANI BİZ HESAPLIYORUZ (daha güvenli kontrol)
            int hesaplananPuan = 0;
            // Kategorilerimizi sabit bir listede tutalım
            var kontrolEdilecekKategoriler = new[] { "isim", "sehir", "hayvan", "bitki", "esya" };

            foreach (var kat in kontrolEdilecekKategoriler)
            {
                // AI'dan gelen cevapta bu kategori var mı?
                if (validationsElement.TryGetProperty(kat, out var val))
                {
                    // Değer true (boolean) ya da "true" (string) olabilir
                    bool isTrue = (val.ValueKind == JsonValueKind.True) ||
                                  (val.ValueKind == JsonValueKind.String && val.GetString()?.ToLower() == "true");

                    if (isTrue)
                    {
                        hesaplananPuan += 10; // Her doğru 10 puan
                    }
                }
            }

            // Frontend'e hem doğrulamaları hem de kesin puanı gönder
            return Ok(new
            {
                validations = validationsElement,
                totalScore = hesaplananPuan
            });
        }
        catch (Exception ex)
        {
            // Hata durumunda 500 döndürelim, mesajı da loglamak isteyebilirsin.
            return StatusCode(500, $"Sunucu hatası: {ex.Message}");
        }
    }
}

public class GameRequest
{
    public string SelectedLetter { get; set; } = "";
    public Dictionary<string, string> Answers { get; set; } = new();
}