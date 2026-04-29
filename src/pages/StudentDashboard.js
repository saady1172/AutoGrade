import React, { useEffect, useState } from "react";
import "./StudentDashboard.css";

const API = "http://localhost:5217";

export default function StudentDashboard({ user, onLogout }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/grading/submissions`)
      .then((r) => r.json())
      .then((data) => {
        const mine = data.filter(
          (s) => s.studentName.toLowerCase() === user.name.toLowerCase()
        );
        setSubmissions(mine);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [user.name]);

  const scoreColor = (score) => (score < 50 ? "#ffb3b3" : "#b7ffb7");
  const scoreText = (score) => (score < 50 ? "#c90707" : "#15a315");

  if (selected) {
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => setSelected(null)}>
            ← Back to Results
          </button>
        </div>

        <div className="sd-detail-card">
          <div className="sd-detail-top">
            <div>
              <p className="sd-detail-label">Subject</p>
              <p className="sd-detail-value">{selected.subject}</p>
            </div>
            <div
              className="sd-score-badge"
              style={{
                backgroundColor: scoreColor(selected.score),
                color: scoreText(selected.score),
              }}
            >
              {selected.score}/100
            </div>
          </div>

          <p className="sd-detail-label">Question</p>
          <p className="sd-detail-value">{selected.question}</p>

          <p className="sd-detail-label">Your Answer</p>
          <textarea className="sd-textarea" readOnly value={selected.studentAnswer} />

          <p className="sd-detail-label">Model Answer</p>
          <div className="sd-model-box">
            <p>{selected.modelAnswer || "Not provided"}</p>
          </div>

          <p className="sd-detail-label">Feedback</p>
          <textarea className="sd-textarea" readOnly value={selected.feedback} />
        </div>
      </div>
    );
  }

  return (
    <div className="sd-container">
      <div className="sd-header">
        <h1 className="sd-logo">AutoGrade</h1>
        <div className="sd-user-info">
          <span>Welcome, {user.name}</span>
          <button className="sd-logout-btn" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      <h2 className="sd-title">My Results</h2>

      {loading && <p className="sd-empty">Loading...</p>}

      {!loading && submissions.length === 0 && (
        <p className="sd-empty">No results yet. Your teacher hasn't graded any submissions for you.</p>
      )}

      {!loading && submissions.length > 0 && (
        <div className="sd-list">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="sd-card"
              onClick={() => setSelected(s)}
            >
              <div className="sd-card-left">
                <p className="sd-card-subject">{s.subject}</p>
                <p className="sd-card-question">{s.question}</p>
                <p className="sd-card-date">
                  {new Date(s.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div
                className="sd-card-score"
                style={{
                  backgroundColor: scoreColor(s.score),
                  color: scoreText(s.score),
                }}
              >
                {s.score}/100
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
