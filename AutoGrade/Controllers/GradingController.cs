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

            var submission = new Submission
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
            };

            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync();

            return Ok(result);
        }

        [HttpPost("student-submit")]
        public async Task<IActionResult> StudentSubmit([FromBody] StudentSubmitRequest request)
        {
            var assignment = await _db.Assignments.FindAsync(request.AssignmentId);
            if (assignment == null)
                return NotFound(new { message = "Assignment not found" });

            var alreadySubmitted = await _db.Submissions
                .AnyAsync(s => s.AssignmentId == request.AssignmentId &&
                               s.StudentName.ToLower() == request.StudentName.ToLower());
            if (alreadySubmitted)
                return BadRequest(new { message = "You have already submitted this assignment." });

            if (assignment.Deadline.HasValue && DateTime.UtcNow > assignment.Deadline.Value)
                return BadRequest(new { message = "The deadline for this assignment has passed." });

            var gradeRequest = new GradeRequest
            {
                StudentName = request.StudentName,
                Subject = assignment.Subject,
                Question = assignment.Question,
                StudentAnswer = request.StudentAnswer,
                ModelAnswer = assignment.ModelAnswer
            };

            var result = await _aiService.GradeAnswerAsync(gradeRequest);

            var submission = new Submission
            {
                StudentName = request.StudentName,
                Subject = assignment.Subject,
                Question = assignment.Question,
                StudentAnswer = request.StudentAnswer,
                ModelAnswer = assignment.ModelAnswer,
                Score = result.Grade,
                Feedback = result.Feedback,
                Suggestions = string.Join("|", result.Suggestions),
                StudentGrade = request.StudentGrade,
                AssignmentId = request.AssignmentId,
                CreatedAt = DateTime.UtcNow
            };

            _db.Submissions.Add(submission);
            await _db.SaveChangesAsync();

            return Ok(result);
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
