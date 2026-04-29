namespace AutoGrade.Models
{
    public class GradeResponse
    {
        public int Grade { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public List<string> Suggestions { get; set; } = new();
    }
}
