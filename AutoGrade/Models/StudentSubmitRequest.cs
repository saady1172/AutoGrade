namespace AutoGrade.Models
{
    public class StudentSubmitRequest
    {
        public int AssignmentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string StudentAnswer { get; set; } = string.Empty;
        public string StudentGrade { get; set; } = string.Empty;
    }
}
