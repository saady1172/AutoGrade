using AutoGrade.Services;
using AutoGrade.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();           // Minimal API OpenAPI
builder.Services.AddScoped<AIGradingService>();

var app = builder.Build();

// Map OpenAPI JSON
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();                     // Generates https://localhost:7119/openapi
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();