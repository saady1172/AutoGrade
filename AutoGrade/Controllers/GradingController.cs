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
    }
}
