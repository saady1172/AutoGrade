namespace AutoGrade.Models
{
    public class Submission
    {
        public int Id { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Question { get; set; } = string.Empty;
        public string StudentAnswer { get; set; } = string.Empty;
        public string ModelAnswer { get; set; } = string.Empty;
        public int Score { get; set; }
        public string Feedback { get; set; } = string.Empty;
        public string Suggestions { get; set; } = string.Empty;
        public string StudentGrade { get; set; } = string.Empty;
        public int? AssignmentId { get; set; }
        public int? AssignmentQuestionId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
