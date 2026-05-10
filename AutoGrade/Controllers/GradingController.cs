using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoGrade.Data;
using AutoGrade.Models;
using AutoGrade.Services;

namespace AutoGrade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradingController : ControllerBase
    {
        private readonly AIGradingService _aiService;
        private readonly AppDbContext _db;

        public GradingController(AIGradingService aiService, AppDbContext db)
        {
            _aiService = aiService;
            _db = db;
        }

        [HttpPost("grade")]
        public async Task<IActionResult> GradeAnswer([FromBody] GradeRequest request)
        {
            var result = await _aiService.GradeAnswerAsync(request);

            _db.Submissions.Add(new Submission
            {
                StudentName = request.StudentName,
                Subject = request.Subject,
                Question = request.Question,
                StudentAnswer = request.StudentAnswer,
                ModelAnswer = request.ModelAnswer,
                Score = result.Grade,
                Feedback = result.Feedback,
                Suggestions = string.Join("|", result.Suggestions),
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync();

            return Ok(result);
        }

        [HttpPost("student-submit")]
        public async Task<IActionResult> StudentSubmit([FromBody] StudentSubmitRequest request)
        {
            var assignment = await _db.Assignments
                .Include(a => a.Questions.OrderBy(q => q.OrderIndex))
                .FirstOrDefaultAsync(a => a.Id == request.AssignmentId);

            if (assignment == null)
                return NotFound(new { message = "Assignment not found" });

            var alreadySubmitted = await _db.Submissions
                .AnyAsync(s => s.AssignmentId == request.AssignmentId &&
                               s.StudentName.ToLower() == request.StudentName.ToLower());
            if (alreadySubmitted)
                return BadRequest(new { message = "You have already submitted this assignment." });

            if (assignment.Deadline.HasValue && DateTime.UtcNow > assignment.Deadline.Value)
                return BadRequest(new { message = "The deadline for this assignment has passed." });

            var questionResults = new List<object>();
            var feedbackParts = new List<string>();
            var allSuggestions = new List<string>();
            int totalScore = 0;
            int gradedCount = 0;

            foreach (var answer in request.Answers)
            {
                var question = assignment.Questions.FirstOrDefault(q => q.Id == answer.QuestionId);
                if (question == null) continue;

                var gradeRequest = new GradeRequest
                {
                    StudentName = request.StudentName,
                    Subject = assignment.Subject,
                    Question = question.QuestionText,
                    StudentAnswer = answer.Answer,
                    ModelAnswer = question.ModelAnswer
                };

                var result = await _aiService.GradeAnswerAsync(gradeRequest);

                _db.Submissions.Add(new Submission
                {
                    StudentName = request.StudentName,
                    Subject = assignment.Subject,
                    Question = question.QuestionText,
                    StudentAnswer = answer.Answer,
                    ModelAnswer = question.ModelAnswer,
                    Score = result.Grade,
                    Feedback = result.Feedback,
                    Suggestions = string.Join("|", result.Suggestions),
                    StudentGrade = request.StudentGrade,
                    AssignmentId = request.AssignmentId,
                    AssignmentQuestionId = question.Id,
                    CreatedAt = DateTime.UtcNow
                });

                totalScore += result.Grade;
                gradedCount++;
                feedbackParts.Add(result.Feedback);
                allSuggestions.AddRange(result.Suggestions);

                questionResults.Add(new
                {
                    questionId = question.Id,
                    questionText = question.QuestionText,
                    grade = result.Grade,
                    feedback = result.Feedback,
                    suggestions = result.Suggestions
                });
            }

            await _db.SaveChangesAsync();

            int avgScore = gradedCount > 0 ? totalScore / gradedCount : 0;

            return Ok(new
            {
                grade = avgScore,
                feedback = string.Join(" | ", feedbackParts),
                suggestions = allSuggestions.Distinct().Take(5).ToList(),
                questions = questionResults
            });
        }

        [HttpGet("submissions")]
        public async Task<IActionResult> GetSubmissions()
        {
            var submissions = await _db.Submissions
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return Ok(submissions);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var submissions = await _db.Submissions.ToListAsync();
            return Ok(new
            {
                TotalSubmissions = submissions.Count,
                AverageScore = submissions.Count > 0
                    ? Math.Round(submissions.Average(s => s.Score), 1)
                    : 0.0,
                Submissions = submissions.OrderByDescending(s => s.CreatedAt).ToList()
            });
        }
    }
}
