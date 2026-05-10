using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoGrade.Data;
using AutoGrade.Models;

namespace AutoGrade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AssignmentsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public AssignmentsController(AppDbContext db)
        {
            _db = db;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentRequest request)
        {
            var assignment = new Assignment
            {
                Subject = request.Subject,
                Grade = request.Grade,
                Deadline = request.Deadline,
                CreatedAt = DateTime.UtcNow
            };
            _db.Assignments.Add(assignment);
            await _db.SaveChangesAsync();

            for (int i = 0; i < request.Questions.Count; i++)
            {
                _db.AssignmentQuestions.Add(new AssignmentQuestion
                {
                    AssignmentId = assignment.Id,
                    QuestionText = request.Questions[i].QuestionText,
                    ModelAnswer = request.Questions[i].ModelAnswer,
                    OrderIndex = i
                });
            }
            await _db.SaveChangesAsync();

            var created = await _db.Assignments
                .Include(a => a.Questions.OrderBy(q => q.OrderIndex))
                .FirstAsync(a => a.Id == assignment.Id);
            return Ok(created);
        }

        [HttpGet]
        public async Task<IActionResult> GetAssignments([FromQuery] string? grade = null)
        {
            var query = _db.Assignments
                .Include(a => a.Questions.OrderBy(q => q.OrderIndex))
                .AsQueryable();
            if (!string.IsNullOrEmpty(grade))
                query = query.Where(a => a.Grade == grade);
            var assignments = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
            return Ok(assignments);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAssignment(int id)
        {
            var assignment = await _db.Assignments.FindAsync(id);
            if (assignment == null)
                return NotFound();
            _db.Assignments.Remove(assignment);
            await _db.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("{id}/missing")]
        public async Task<IActionResult> GetMissingStudents(int id)
        {
            var assignment = await _db.Assignments.FindAsync(id);
            if (assignment == null)
                return NotFound();

            var students = await _db.Users
                .Where(u => u.Role == "student" && u.Grade == assignment.Grade)
                .ToListAsync();

            var submitted = await _db.Submissions
                .Where(s => s.AssignmentId == id)
                .Select(s => s.StudentName.ToLower())
                .Distinct()
                .ToListAsync();

            var missing = students
                .Where(s => !submitted.Contains(s.FullName.ToLower()))
                .Select(s => new { s.FullName, s.Grade })
                .ToList();

            return Ok(missing);
        }
    }
}
