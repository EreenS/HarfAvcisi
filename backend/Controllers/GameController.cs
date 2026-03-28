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
        string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={_apiKey}";

        using var client = new HttpClient();

        // 3. Değerleri güvenli bir şekilde alalım
        string isim = GetSafeValue("isim");
        string sehir = GetSafeValue("sehir");
        string hayvan = GetSafeValue("hayvan");
        string bitki = GetSafeValue("bitki");
        string esya = GetSafeValue("esya");

    // 4. Prompt: AI'ya vereceğimiz talimat (her kategoriyi ayrı değerlendir, sadece validations dönsün)
    string promptText = $@"
Sen bir Harf Avcısı oyunu hakemisin. Seçilen harf: '{request.SelectedLetter}'.

Her kategoriyi ayrı ayrı değerlendir:
- İsim: '{isim}' → '{request.SelectedLetter}' harfiyle başlayan gerçek bir Türkçe isim mi?
- Şehir: '{sehir}' → '{request.SelectedLetter}' harfiyle başlayan gerçek bir şehir adı mı? (Türkiye veya dünya şehirleri)
- Hayvan: '{hayvan}' → '{request.SelectedLetter}' harfiyle başlayan gerçek bir hayvan adı mı?
- Bitki: '{bitki}' → '{request.SelectedLetter}' harfiyle başlayan gerçek bir bitki adı mı?
- Eşya: '{esya}' → '{request.SelectedLetter}' harfiyle başlayan gerçek bir eşya/nesne adı mı?

KURAL: Boş, saçma veya harfle başlamayan cevaplar false'tur.

SADECE bu JSON formatında yanıt ver:
{{ ""validations"": {{ ""isim"": true, ""sehir"": false, ""hayvan"": true, ""bitki"": false, ""esya"": true }} }}

Açıklama yapma, sadece JSON döndür.";

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

            // Gemini API'den gelen ham yanıtı logla
            Console.WriteLine($"Gemini API Ham Yanıt: {result}");

            // Eğer istek başarısızsa (ör. quota aşıldıysa) direkt hata dön
            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Gemini API hatası: Quota aşıldı veya başka bir sorun oluştu.");
            }

            // Google AI cevabını parse et
            using var apiResponseDoc = JsonDocument.Parse(result);

            var candidates = apiResponseDoc.RootElement.GetProperty("candidates");
            string? aiText = candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (string.IsNullOrEmpty(aiText))
                return BadRequest("AI boş yanıt döndü.");

            // JSON bloğunu regex ile çıkar (``` işaretleri vs. olsa bile)
            var match = System.Text.RegularExpressions.Regex.Match(aiText, @"\{[\s\S]*\}");
            if (!match.Success)
                return BadRequest("AI geçerli JSON döndürmedi.");

            string cleanJson = match.Value.Trim();

            // Gemini'den gelen ham JSON'u logla
            Console.WriteLine($"Gemini Ham Yanıt: {cleanJson}");

            // AI'dan gelen JSON'u parse et (sadece validations var)
            using var validationDoc = JsonDocument.Parse(cleanJson);
            var validationsElement = validationDoc.RootElement.GetProperty("validations");

            // validations bilgisini dispose olmadan sonra da kullanabilmek için Dictionary'ye kopyalıyoruz
            var validationsDict = new Dictionary<string, bool>();
            var kontrolEdilecekKategoriler = new[] { "isim", "sehir", "hayvan", "bitki", "esya" };

            int hesaplananPuan = 0;
            foreach (var kat in kontrolEdilecekKategoriler)
            {
                if (validationsElement.TryGetProperty(kat, out var val))
                {
                    // Değer true (boolean) ya da "true" (string) olabilir
                    bool isTrue = (val.ValueKind == JsonValueKind.True) ||
                                  (val.ValueKind == JsonValueKind.String && val.GetString()?.ToLower() == "true");

                    validationsDict[kat] = isTrue;
                    if (isTrue)
                    {
                        hesaplananPuan += 10; // Her doğru 10 puan
                    }
                }
                else
                {
                    validationsDict[kat] = false;
                }
            }
            // using bloğu burada kapanacak, artık JsonDocument'e ihtiyaç yok

            // Frontend'e hem doğrulamaları hem de kesin puanı gönder
            return Ok(new
            {
                validations = validationsDict,
                totalScore = hesaplananPuan
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"HATA: {ex.Message}");
            Console.WriteLine($"STACK: {ex.StackTrace}");
            return StatusCode(500, $"Sunucu hatası: {ex.Message}");
        }
    }
}

public class GameRequest
{
    public string SelectedLetter { get; set; } = "";
    public Dictionary<string, string> Answers { get; set; } = new();
}