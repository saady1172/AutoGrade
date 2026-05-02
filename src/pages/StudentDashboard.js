import React, { useEffect, useState } from "react";
import "./StudentDashboard.css";

const API = "http://localhost:5217";

export default function StudentDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("assignments");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("tabs");
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [answer, setAnswer] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/assignments?grade=${encodeURIComponent(user.grade || "")}`).then((r) => r.json()),
      fetch(`${API}/api/grading/submissions`).then((r) => r.json()),
    ])
      .then(([a, s]) => {
        setAssignments(a);
        setSubmissions(
          s.filter((x) => x.studentName.toLowerCase() === user.name.toLowerCase())
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [user.name]);

  const scoreColor = (score) => (score < 50 ? "#ffb3b3" : "#b7ffb7");
  const scoreText = (score) => (score < 50 ? "#c90707" : "#15a315");

  const submittedAssignmentIds = new Set(
    submissions.filter((s) => s.assignmentId != null).map((s) => s.assignmentId)
  );

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API}/api/grading/student-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          studentName: user.name,
          studentAnswer: answer,
          studentGrade: user.grade || "",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Submission failed.");
        setView("tabs");
        setActiveAssignment(null);
        setAnswer("");
        return;
      }
      const data = await res.json();
      setResult(data);
      setView("result");
      fetchData();
    } catch {
      alert("Error submitting. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Past submission detail
  if (view === "detail" && activeSubmission) {
    const suggestions = activeSubmission.suggestions
      ? activeSubmission.suggestions.split("|").filter(Boolean)
      : [];
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => { setView("tabs"); setActiveSubmission(null); }}>
            ← Back to Results
          </button>
        </div>
        <div className="sd-detail-card">
          <div className="sd-detail-top">
            <div>
              <p className="sd-detail-label">Subject</p>
              <p className="sd-detail-value">{activeSubmission.subject}</p>
            </div>
            <div className="sd-score-badge" style={{ backgroundColor: scoreColor(activeSubmission.score), color: scoreText(activeSubmission.score) }}>
              {activeSubmission.score}/100
            </div>
          </div>
          <p className="sd-detail-label">Question</p>
          <p className="sd-detail-value">{activeSubmission.question}</p>
          <p className="sd-detail-label">Your Answer</p>
          <textarea className="sd-textarea" readOnly value={activeSubmission.studentAnswer} />
          <p className="sd-detail-label">Feedback</p>
          <textarea className="sd-textarea" readOnly value={activeSubmission.feedback} />
          {suggestions.length > 0 && (
            <>
              <p className="sd-detail-label">Suggestions</p>
              <ul className="sd-suggestions">{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
        </div>
      </div>
    );
  }

  // Answer submission form
  if (view === "submit" && activeAssignment) {
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => { setView("tabs"); setActiveAssignment(null); setAnswer(""); }}>
            ← Back
          </button>
        </div>
        <div className="sd-detail-card">
          <p className="sd-detail-label">Subject</p>
          <p className="sd-detail-value">{activeAssignment.subject}</p>
          {activeAssignment.deadline && (
            <p className="sd-card-deadline">Due: {new Date(activeAssignment.deadline).toLocaleString()}</p>
          )}
          <p className="sd-detail-label">Question</p>
          <p className="sd-question-text">{activeAssignment.question}</p>
          <p className="sd-detail-label">Your Answer</p>
          <textarea
            className="sd-textarea sd-answer-input"
            placeholder="Write your answer here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
          <button
            className="sd-submit-btn"
            onClick={handleSubmitAnswer}
            disabled={submitLoading || !answer.trim()}
          >
            {submitLoading ? "Grading..." : "Submit Answer"}
          </button>
        </div>
      </div>
    );
  }

  // Result after grading
  if (view === "result" && result) {
    const suggestions = result.suggestions || [];
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
        </div>
        <div className="sd-detail-card">
          <h2 className="sd-result-title">Graded!</h2>
          <div className="sd-score-badge sd-score-center" style={{ backgroundColor: scoreColor(result.grade), color: scoreText(result.grade) }}>
            {result.grade}/100
          </div>
          <p className="sd-detail-label">Feedback</p>
          <textarea className="sd-textarea" readOnly value={result.feedback} />
          {suggestions.length > 0 && (
            <>
              <p className="sd-detail-label">Suggestions</p>
              <ul className="sd-suggestions">{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
          <button className="sd-submit-btn" onClick={() => { setView("tabs"); setTab("grades"); setResult(null); setActiveAssignment(null); setAnswer(""); }}>
            View My Grades
          </button>
        </div>
      </div>
    );
  }

  // Main tabs view
  return (
    <div className="sd-container">
      <div className="sd-header">
        <h1 className="sd-logo">AutoGrade</h1>
        <div className="sd-user-info">
          <span>Welcome, {user.name}</span>
          <button className="sd-logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="sd-tabs">
        <button className={`sd-tab ${tab === "assignments" ? "sd-tab-active" : ""}`} onClick={() => setTab("assignments")}>
          Open Assignments
        </button>
        <button className={`sd-tab ${tab === "grades" ? "sd-tab-active" : ""}`} onClick={() => setTab("grades")}>
          My Grades
        </button>
      </div>

      {loading && <p className="sd-empty">Loading...</p>}

      {!loading && tab === "assignments" && (
        <>
          {assignments.length === 0 && <p className="sd-empty">No assignments yet. Check back later!</p>}
          <div className="sd-list">
            {assignments.map((a) => {
              const isSubmitted = submittedAssignmentIds.has(a.id);
              const isPastDeadline = a.deadline && new Date(a.deadline) < new Date();
              return (
                <div key={a.id} className="sd-card">
                  <div className="sd-card-left">
                    <p className="sd-card-subject">{a.subject}</p>
                    <p className="sd-card-question">{a.question}</p>
                    {a.deadline && (
                      <p className="sd-card-deadline">
                        Due: {new Date(a.deadline).toLocaleString()}
                      </p>
                    )}
                    <p className="sd-card-date">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isSubmitted ? (
                    <span className="sd-status-badge sd-submitted">Submitted ✓</span>
                  ) : isPastDeadline ? (
                    <span className="sd-status-badge sd-closed">Closed</span>
                  ) : (
                    <button className="sd-answer-btn" onClick={() => { setActiveAssignment(a); setAnswer(""); setView("submit"); }}>
                      Submit Answer
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && tab === "grades" && (
        <>
          {submissions.length === 0 && <p className="sd-empty">No grades yet. Submit an answer first!</p>}
          <div className="sd-list">
            {submissions.map((s) => (
              <div key={s.id} className="sd-card" onClick={() => { setActiveSubmission(s); setView("detail"); }}>
                <div className="sd-card-left">
                  <p className="sd-card-subject">{s.subject}</p>
                  <p className="sd-card-question">{s.question}</p>
                  <p className="sd-card-date">{new Date(s.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="sd-card-score" style={{ backgroundColor: scoreColor(s.score), color: scoreText(s.score) }}>
                  {s.score}/100
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
