var builder = WebApplication.CreateBuilder(args);

// 1. Controller desteğini ekliyoruz (GameController'ın çalışması için şart)
builder.Services.AddControllers();

// 2. OpenAPI desteği (Swagger/OpenAPI için)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();

// 3. CORS Ayarı: Frontend (React) farklı porttan rahatça veri göndersin diye
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
});

var app = builder.Build();

// 4. Geliştirme aşamasında yardımcı araçları aktif et
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// 5. Güvenlik ve CORS'u devreye al
app.UseCors("AllowAll");
//app.UseHttpsRedirection();
app.UseAuthorization();

// 6. Gelen istekleri Controller sınıflarına (GameController gibi) yönlendir
app.MapControllers();

app.Run();