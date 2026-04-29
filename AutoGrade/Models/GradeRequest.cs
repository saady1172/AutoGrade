namespace AutoGrade.Models
{
    public class GradeRequest
    {
        public string StudentName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string StudentAnswer { get; set; } = string.Empty;
        public string ModelAnswer { get; set; } = string.Empty;
    }
}
