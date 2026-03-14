using Microsoft.AspNetCore.Mvc;
using AutoGrade.Models;
using AutoGrade.Services;

namespace AutoGrade.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GradingController : ControllerBase
    {
        private readonly AIGradingService _aiService;

        public GradingController(AIGradingService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("grade")]
        public IActionResult GradeAnswer([FromBody] GradeRequest request)
        {
            var result = _aiService.GradeAnswer(request);
            return Ok(result);
        }
    }
}