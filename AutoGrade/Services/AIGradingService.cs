using AutoGrade.Models;

namespace AutoGrade.Services
{
    public class AIGradingService
    {
        public GradeResponse GradeAnswer(GradeRequest request)
        {
            int score = request.StudentAnswer.Length > 50 ? 90 : 60;

            return new GradeResponse
            {
                Grade = score,
                Feedback = "AI evaluated the answer."
            };
        }
    }
}