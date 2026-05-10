namespace AutoGrade.Models
{
    public class AssignmentQuestion
    {
        public int Id { get; set; }
        public int AssignmentId { get; set; }
        public string QuestionText { get; set; } = string.Empty;
        public string ModelAnswer { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
    }
}
