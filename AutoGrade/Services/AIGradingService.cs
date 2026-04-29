using System.Text;
using System.Text.Json;
using AutoGrade.Models;

namespace AutoGrade.Services
{
    public class AIGradingService
    {
        private readonly HttpClient _http;
        private const string PythonApiUrl = "http://localhost:8000/predict";

        public AIGradingService(HttpClient http)
        {
            _http = http;
        }

        public async Task<GradeResponse> GradeAnswerAsync(GradeRequest request)
        {
            var payload = JsonSerializer.Serialize(new
            {
                question = request.Question,
                answer = request.StudentAnswer,
                model_answer = request.ModelAnswer
            });

            var content = new StringContent(payload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _http.PostAsync(PythonApiUrl, content);
                var body = await response.Content.ReadAsStringAsync();

                var data = JsonSerializer.Deserialize<JsonElement>(body);

                float rawScore = data.GetProperty("score").GetSingle();
                int grade = (int)Math.Round(rawScore * 10);
                string feedback = data.GetProperty("feedback").GetString() ?? "";
                var suggestions = data.GetProperty("suggestions")
                    .EnumerateArray()
                    .Select(s => s.GetString() ?? "")
                    .ToList();

                return new GradeResponse
                {
                    Grade = grade,
                    Feedback = feedback,
                    Suggestions = suggestions
                };
            }
            catch
            {
                return new GradeResponse
                {
                    Grade = 0,
                    Feedback = "Could not connect to the AI grading service. Make sure the Python API is running on port 8000.",
                    Suggestions = new List<string>()
                };
            }
        }
    }
}
