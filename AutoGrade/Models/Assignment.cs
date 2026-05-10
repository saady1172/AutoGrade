namespace AutoGrade.Models
{
    public class Assignment
    {
        public int Id { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Grade { get; set; } = string.Empty;
        public DateTime? Deadline { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<AssignmentQuestion> Questions { get; set; } = new();
    }
}
