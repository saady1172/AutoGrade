import React, { useState } from "react";
import "./CreateAssignment.css";

const API = "http://localhost:5217";

export default function CreateAssignment({ onBack, onCreated }) {
  const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);
  const [form, setForm] = useState({ subject: "", grade: "", deadline: "" });
  const [questions, setQuestions] = useState([{ questionText: "", modelAnswer: "" }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addQuestion = () =>
    setQuestions((prev) => [...prev, { questionText: "", modelAnswer: "" }]);

  const removeQuestion = (index) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const updateQuestion = (index, field, value) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.grade) {
      setError("Subject and grade are required.");
      return;
    }
    if (questions.some((q) => !q.questionText.trim() || !q.modelAnswer.trim())) {
      setError("Every question must have both a question and a model answer.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: form.subject,
          grade: form.grade,
          deadline: form.deadline || null,
          questions,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      onCreated();
    } catch {
      setError("Failed to create assignment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="ca-container">
      <h1 className="ca-logo">AutoGrade</h1>
      <div className="ca-card">
        <h2 className="ca-title">New Assignment</h2>

        <input
          className="ca-input"
          placeholder="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
        />
        <select
          className="ca-input"
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
        >
          <option value="">Select Grade</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <label className="ca-deadline-label">Deadline (optional)</label>
        <input
          className="ca-input"
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />

        <div className="ca-questions-header">
          <span className="ca-questions-title">Questions</span>
          <button className="ca-add-q-btn" type="button" onClick={addQuestion}>
            + Add Question
          </button>
        </div>

        {questions.map((q, i) => (
          <div key={i} className="ca-question-block">
            <div className="ca-question-block-header">
              <span className="ca-question-num">Question {i + 1}</span>
              {questions.length > 1 && (
                <button
                  className="ca-remove-q-btn"
                  type="button"
                  onClick={() => removeQuestion(i)}
                >
                  Remove
                </button>
              )}
            </div>
            <textarea
              className="ca-textarea"
              placeholder="Question text"
              value={q.questionText}
              onChange={(e) => updateQuestion(i, "questionText", e.target.value)}
            />
            <textarea
              className="ca-textarea ca-model-answer"
              placeholder="Model answer (used by AI for grading)"
              value={q.modelAnswer}
              onChange={(e) => updateQuestion(i, "modelAnswer", e.target.value)}
            />
          </div>
        ))}

        {error && <p className="ca-error">{error}</p>}

        <div className="ca-btn-row">
          <button className="ca-submit-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Create Assignment"}
          </button>
          <button className="ca-back-btn" onClick={onBack}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
