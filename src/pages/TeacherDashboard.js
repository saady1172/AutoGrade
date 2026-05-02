import React, { useEffect, useState } from "react";
import "./TeacherDashboard.css";

const API = "http://localhost:5217";
const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

export default function TeacherDashboard({ user, onLogout, onCreateAssignment }) {
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("submissions");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [missingData, setMissingData] = useState({});
  const [loadingMissing, setLoadingMissing] = useState({});
  const [expandedMissing, setExpandedMissing] = useState(new Set());

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/grading/stats`).then((r) => r.json()),
      fetch(`${API}/api/assignments`).then((r) => r.json()),
    ])
      .then(([s, a]) => { setStats(s); setAssignments(a); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const scoreColor = (score) => (score < 50 ? "#ffb3b3" : "#b7ffb7");
  const scoreText = (score) => (score < 50 ? "#c90707" : "#15a315");

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this assignment? Students will no longer see it.")) return;
    await fetch(`${API}/api/assignments/${id}`, { method: "DELETE" });
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleMissing = async (assignmentId) => {
    if (expandedMissing.has(assignmentId)) {
      setExpandedMissing((prev) => { const s = new Set(prev); s.delete(assignmentId); return s; });
      return;
    }
    if (!missingData[assignmentId]) {
      setLoadingMissing((prev) => ({ ...prev, [assignmentId]: true }));
      try {
        const res = await fetch(`${API}/api/assignments/${assignmentId}/missing`);
        const data = await res.json();
        setMissingData((prev) => ({ ...prev, [assignmentId]: data }));
      } finally {
        setLoadingMissing((prev) => ({ ...prev, [assignmentId]: false }));
      }
    }
    setExpandedMissing((prev) => new Set([...prev, assignmentId]));
  };

  const filteredSubmissions = stats
    ? gradeFilter === "all"
      ? stats.submissions
      : stats.submissions.filter((s) => s.studentGrade === gradeFilter)
    : [];

  const downloadCSV = () => {
    const rows = filteredSubmissions.map((s) =>
      `"${s.studentName}","${s.studentGrade || ""}","${s.subject}",${s.score},"${new Date(s.createdAt).toLocaleDateString()}"`
    );
    const csv = ["Student Name,Grade,Subject,Score,Date", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "grades.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Submission detail view
  if (selected) {
    const suggestions = selected.suggestions ? selected.suggestions.split("|").filter(Boolean) : [];
    return (
      <div className="td-container">
        <div className="td-header">
          <h1 className="td-logo">AutoGrade</h1>
          <button className="td-back-btn" onClick={() => setSelected(null)}>← Back</button>
        </div>
        <div className="td-detail-card">
          <div className="td-detail-top">
            <div>
              <p className="td-label">Student</p>
              <p className="td-value">{selected.studentName}</p>
              <p className="td-label">Grade</p>
              <p className="td-value">{selected.studentGrade || "—"}</p>
              <p className="td-label">Subject</p>
              <p className="td-value">{selected.subject}</p>
            </div>
            <div className="td-score-badge" style={{ backgroundColor: scoreColor(selected.score), color: scoreText(selected.score) }}>
              {selected.score}/100
            </div>
          </div>
          <p className="td-label">Question</p>
          <p className="td-value">{selected.question}</p>
          <p className="td-label">Student Answer</p>
          <textarea className="td-textarea" readOnly value={selected.studentAnswer} />
          <p className="td-label">Feedback</p>
          <textarea className="td-textarea" readOnly value={selected.feedback} />
          {suggestions.length > 0 && (
            <>
              <p className="td-label">Suggestions</p>
              <ul className="td-suggestions">{suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="td-container">
      <div className="td-header">
        <h1 className="td-logo">AutoGrade</h1>
        <div className="td-header-right">
          <span>Welcome, {user.name}</span>
          <button className="td-create-btn" onClick={onCreateAssignment}>+ New Assignment</button>
          <button className="td-logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div className="td-tabs">
        <button className={`td-tab ${tab === "submissions" ? "td-tab-active" : ""}`} onClick={() => setTab("submissions")}>
          Submissions
        </button>
        <button className={`td-tab ${tab === "assignments" ? "td-tab-active" : ""}`} onClick={() => setTab("assignments")}>
          Assignments
        </button>
      </div>

      {loading && <p className="td-empty">Loading...</p>}

      {!loading && tab === "submissions" && stats && (
        <>
          <div className="td-stats-row">
            <div className="td-stat-card">
              <p className="td-stat-number">{filteredSubmissions.length}</p>
              <p className="td-stat-label">Total Submissions</p>
            </div>
            <div className="td-stat-card">
              <p className="td-stat-number">
                {filteredSubmissions.length > 0
                  ? Math.round(filteredSubmissions.reduce((a, s) => a + s.score, 0) / filteredSubmissions.length * 10) / 10
                  : 0}
              </p>
              <p className="td-stat-label">Class Average</p>
            </div>
          </div>

          <div className="td-toolbar">
            <select className="td-grade-filter" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
              <option value="all">All Grades</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <button className="td-csv-btn" onClick={downloadCSV} disabled={filteredSubmissions.length === 0}>
              Download CSV
            </button>
          </div>

          {filteredSubmissions.length === 0 && <p className="td-empty">No submissions yet.</p>}

          {filteredSubmissions.length > 0 && (
            <div className="td-table-wrapper">
              <table className="td-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Grade</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.studentName}</td>
                      <td>{s.studentGrade || "—"}</td>
                      <td>{s.subject}</td>
                      <td>
                        <span className="td-score-pill" style={{ backgroundColor: scoreColor(s.score), color: scoreText(s.score) }}>
                          {s.score}/100
                        </span>
                      </td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td><button className="td-view-btn" onClick={() => setSelected(s)}>View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!loading && tab === "assignments" && (
        <>
          {assignments.length === 0 && (
            <p className="td-empty">No assignments yet. Click "+ New Assignment" to create one.</p>
          )}
          <div className="td-list">
            {assignments.map((a) => (
              <div key={a.id} className="td-assign-wrapper">
                <div className="td-assign-card">
                  <div className="td-assign-left">
                    <p className="td-assign-subject">{a.subject}</p>
                    <div className="td-assign-meta">
                      <span className="td-assign-grade-pill">{a.grade}</span>
                      {a.deadline && (
                        <span className="td-assign-deadline">Due: {new Date(a.deadline).toLocaleString()}</span>
                      )}
                    </div>
                    <p className="td-assign-question">{a.question}</p>
                    <p className="td-assign-date">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="td-assign-actions">
                    <button className="td-missing-btn" onClick={() => toggleMissing(a.id)}>
                      {expandedMissing.has(a.id) ? "Hide" : "Who's Missing?"}
                    </button>
                    <button className="td-delete-btn" onClick={() => handleDelete(a.id)}>Delete</button>
                  </div>
                </div>
                {expandedMissing.has(a.id) && (
                  <div className="td-missing-panel">
                    {loadingMissing[a.id] ? (
                      <p className="td-missing-loading">Loading...</p>
                    ) : missingData[a.id]?.length === 0 ? (
                      <p className="td-missing-empty">✓ All students have submitted!</p>
                    ) : (
                      <>
                        <p className="td-missing-title">{missingData[a.id]?.length} student(s) haven't submitted yet:</p>
                        <ul className="td-missing-list">
                          {(missingData[a.id] || []).map((s, i) => <li key={i}>{s.fullName}</li>)}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
