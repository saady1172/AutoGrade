namespace AutoGrade.Models
{
    public class CreateAssignmentRequest
    {
        public string Subject { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public DateTime? Deadline { get; set; }
        public List<QuestionItem> Questions { get; set; } = new();
    }

    public class QuestionItem
    {
        public string QuestionText { get; set; } = string.Empty;
        public string ModelAnswer { get; set; } = string.Empty;
    }
}
