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

    // 4. Prompt: AI'ya vereceğimiz talimat (daha katı kurallar)
    string promptText = $@"
    Sen ÇOK KATI bir Harf Avcısı oyunu hakemisin. 
    Seçilen harf: '{request.SelectedLetter}'.

    Kelimeler: İsim:{isim}, Şehir:{sehir}, Hayvan:{hayvan}, Bitki:{bitki}, Eşya:{esya}.

    Kurallar:
    1. Kelime kesinlikle '{request.SelectedLetter}' ile başlamalı.
    2. Kelime o kategoriye bariz bir şekilde ait olmalı. 
    3. ÖNEMLİ: Malatya, Ankara gibi ŞEHİR isimlerini İSİM kategorisinde ASLA kabul etme. 
    4. Anlamsız harf dizilerini (asd, fgh gibi) ASLA kabul etme.
    5. Sadece gerçek ve mantıklı kelimelere TRUE ver.

    SADECE şu JSON'u dön: 
    {{ ""validations"": {{ ""isim"": false, ""sehir"": true, ... }}, ""totalScore"": 10 }}";

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

            using var doc = JsonDocument.Parse(result);

            // '?' ekleyerek "Eğer varsa al, yoksa hata verme" diyoruz.
            // '!' ekleyerek de "Ben eminim, burası boş gelmeyecek" diye söz veriyoruz.
            var candidates = doc.RootElement.GetProperty("candidates");
            string? aiText = candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (string.IsNullOrEmpty(aiText))
                return BadRequest("AI boş yanıt döndü.");

            string cleanJson = aiText.Replace("```json", "").Replace("```", "").Trim();

            return Content(cleanJson, "application/json");
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