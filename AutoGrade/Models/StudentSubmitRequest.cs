namespace AutoGrade.Models
{
    public class StudentSubmitRequest
    {
        public int AssignmentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentGrade { get; set; } = string.Empty;
        public List<QuestionAnswer> Answers { get; set; } = new();
    }

    public class QuestionAnswer
    {
        public int QuestionId { get; set; }
        public string Answer { get; set; } = string.Empty;
    }
}
