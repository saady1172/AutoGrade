using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using AutoGrade.Data;
using AutoGrade.Models;

namespace AutoGrade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<User> _hasher;

        public AuthController(AppDbContext db, IPasswordHasher<User> hasher)
        {
            _db = db;
            _hasher = hasher;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.FullName) ||
                string.IsNullOrWhiteSpace(req.Email) ||
                string.IsNullOrWhiteSpace(req.Password) ||
                string.IsNullOrWhiteSpace(req.Role))
                return BadRequest(new { message = "All fields are required" });

            var role = req.Role.ToLower();
            if (role != "teacher" && role != "student")
                return BadRequest(new { message = "Role must be teacher or student" });

            if (await _db.Users.AnyAsync(u => u.Email == req.Email))
                return BadRequest(new { message = "Email already registered" });

            var user = new User
            {
                FullName = req.FullName,
                Email = req.Email,
                Role = role
            };
            user.PasswordHash = _hasher.HashPassword(user, req.Password);

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new { message = "Account created successfully" });
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.Users
                .Select(u => new { u.Id, u.FullName, u.Email, u.Role })
                .ToListAsync();
            return Ok(users);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email) ||
                string.IsNullOrWhiteSpace(req.Password) ||
                string.IsNullOrWhiteSpace(req.Role))
                return BadRequest(new { message = "All fields are required" });

            var role = req.Role.ToLower();
            var user = await _db.Users.FirstOrDefaultAsync(
                u => u.Email == req.Email && u.Role == role);

            if (user == null)
                return Unauthorized(new { message = "Invalid email, password, or role" });

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password);
            if (result == PasswordVerificationResult.Failed)
                return Unauthorized(new { message = "Invalid email, password, or role" });

            return Ok(new
            {
                message = "Login successful",
                name = user.FullName,
                email = user.Email,
                role = user.Role
            });
        }
    }
}
