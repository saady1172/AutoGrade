import React, { useState } from "react";
import "./CreateAssignment.css";

const API = "http://localhost:5217";

export default function CreateAssignment({ onBack, onCreated }) {
  const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);
  const [form, setForm] = useState({ subject: "", question: "", modelAnswer: "", grade: "", deadline: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.question.trim() || !form.modelAnswer.trim() || !form.grade) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, deadline: form.deadline || null }),
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
        <textarea
          className="ca-textarea"
          placeholder="Question"
          value={form.question}
          onChange={(e) => setForm({ ...form, question: e.target.value })}
        />
        <textarea
          className="ca-textarea"
          placeholder="Model Answer"
          value={form.modelAnswer}
          onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })}
        />
        <label className="ca-deadline-label">Deadline (optional)</label>
        <input
          className="ca-input"
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
        {error && <p className="ca-error">{error}</p>}
        <div className="ca-btn-row">
          <button
            className="ca-submit-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
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
