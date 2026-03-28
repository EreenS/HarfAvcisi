using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers; // Klasör yapına göre namespace burası olmalı

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    [HttpPost("validate")]
    public IActionResult ValidateAnswers([FromBody] GameRequest request)
    {
        int totalScore = 0;
        var validations = new Dictionary<string, bool>();

        foreach (var answer in request.Answers)
        {
            // Basit kontrol: Boş değilse ve seçilen harfle başlıyorsa 10 puan
            bool isValid = !string.IsNullOrWhiteSpace(answer.Value) && 
                           answer.Value.Trim().ToUpper().StartsWith(request.SelectedLetter.ToUpper());
            
            if (isValid) totalScore += 10;
            validations.Add(answer.Key, isValid);
        }

        return Ok(new { totalScore, validations });
    }
}

// Frontend'den gelen veriyi karşılayacak model
public class GameRequest
{
    public string SelectedLetter { get; set; } = "";
    public Dictionary<string, string> Answers { get; set; } = new();
}