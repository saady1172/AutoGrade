import React, { useEffect, useState } from "react";
import "./TeacherDashboard.css";

const API = "http://localhost:5217";
const GRADES = Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`);

const DIST_BANDS = [
  { label: "90–100", color: "#15a315", bg: "#b7ffb7", min: 90, max: 101 },
  { label: "70–89",  color: "#1a73e8", bg: "#ddeeff", min: 70, max: 90 },
  { label: "50–69",  color: "#e67e22", bg: "#fff0d9", min: 50, max: 70 },
  { label: "0–49",   color: "#c90707", bg: "#ffb3b3", min: 0,  max: 50 },
];

function ScoreLine({ data, height = 160 }) {
  if (!data || data.length === 0)
    return <p className="td-chart-empty">No assignment data yet.</p>;

  const W = 560, H = height;
  const padL = 34, padR = 14, padT = 18, padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xOf = (i) => padL + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yOf = (s) => padT + (1 - s / 100) * plotH;
  const pts = data.map((d, i) => ({ x: xOf(i), y: yOf(d.score) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    data.length > 1
      ? `${linePath} L${pts[pts.length - 1].x},${padT + plotH} L${pts[0].x},${padT + plotH}Z`
      : "";

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line x1={padL} y1={yOf(v)} x2={padL + plotW} y2={yOf(v)} stroke="#e5e7eb" strokeWidth={1} />
          <text x={padL - 6} y={yOf(v) + 4} textAnchor="end" fontSize={10} fill="#bbb">{v}</text>
        </g>
      ))}
      {areaPath && <path d={areaPath} fill="#1a73e8" opacity={0.08} />}
      {data.length > 1 && (
        <path d={linePath} fill="none" stroke="#1a73e8" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1a73e8" stroke="white" strokeWidth={2} />
          <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={10} fill="#1a3d7c" fontWeight="bold">
            {data[i].score}
          </text>
          <text x={p.x} y={H - padB + 16} textAnchor="middle" fontSize={9} fill="#999">
            {(data[i].label || "").length > 9
              ? (data[i].label || "").substring(0, 9) + "…"
              : data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function TeacherDashboard({ user, onLogout, onCreateAssignment }) {
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("submissions");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [nameSearch, setNameSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [profileStudent, setProfileStudent] = useState(null);
  const [missingData, setMissingData] = useState({});
  const [loadingMissing, setLoadingMissing] = useState({});
  const [expandedMissing, setExpandedMissing] = useState(new Set());

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/grading/stats`).then((r) => r.json()),
      fetch(`${API}/api/assignments`).then((r) => r.json()),
      fetch(`${API}/api/auth/enrollment`).then((r) => r.json()),
    ])
      .then(([s, a, e]) => { setStats(s); setAssignments(a); setEnrollment(e); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const scoreColor = (score) => (score < 50 ? "#ffb3b3" : score < 70 ? "#fff0d9" : "#b7ffb7");
  const scoreText  = (score) => (score < 50 ? "#c90707" : score < 70 ? "#c27700" : "#15a315");

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

  // Grade-filtered submissions (used for chart, performers, stats)
  const gradeFiltered = stats
    ? gradeFilter === "all"
      ? stats.submissions
      : stats.submissions.filter((s) => s.studentGrade === gradeFilter)
    : [];

  // Table submissions = grade filter + name search
  const filteredSubmissions = gradeFiltered.filter(
    (s) => !nameSearch.trim() || s.studentName.toLowerCase().includes(nameSearch.toLowerCase())
  );

  // Per-assignment stats from grade-filtered data
  const assignmentStats = {};
  gradeFiltered.forEach((s) => {
    if (s.assignmentId) {
      if (!assignmentStats[s.assignmentId])
        assignmentStats[s.assignmentId] = { studentSet: new Set(), scores: [] };
      assignmentStats[s.assignmentId].studentSet.add(s.studentName.toLowerCase());
      assignmentStats[s.assignmentId].scores.push(s.score);
    }
  });
  Object.values(assignmentStats).forEach((a) => {
    a.count = a.studentSet.size;
    a.avg = Math.round(a.scores.reduce((x, b) => x + b, 0) / a.scores.length);
  });

  // Quiz-level scores: one averaged score per student per quiz (not one per question)
  const quizScores = (() => {
    const byKey = {};
    gradeFiltered.forEach((s) => {
      const key = s.assignmentId
        ? `${s.studentName.toLowerCase()}__${s.assignmentId}`
        : `solo_${s.id}`;
      if (!byKey[key]) byKey[key] = [];
      byKey[key].push(s.score);
    });
    return Object.values(byKey).map((scores) =>
      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    );
  })();

  // Summary stats — all based on quiz-level scores
  const classAvg = quizScores.length > 0
    ? Math.round((quizScores.reduce((a, b) => a + b, 0) / quizScores.length) * 10) / 10
    : 0;
  const passRate = quizScores.length > 0
    ? Math.round((quizScores.filter((s) => s >= 50).length / quizScores.length) * 100)
    : 0;
  const enrolledCount = gradeFilter === "all"
    ? (enrollment?.total || 0)
    : (enrollment?.byGrade?.[gradeFilter] || 0);

  // Score trend data: one point per assignment (chronological)
  const trendData = assignments
    .filter((a) => assignmentStats[a.id])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((a) => ({ label: a.subject, score: assignmentStats[a.id].avg }));

  // Per-student averages — computed from quiz-level scores (not raw question scores)
  const studentAvgMap = {};
  gradeFiltered.forEach((s) => {
    const quizKey = s.assignmentId
      ? `${s.studentName.toLowerCase()}__${s.assignmentId}`
      : `solo_${s.id}`;
    if (!studentAvgMap[s.studentName])
      studentAvgMap[s.studentName] = { name: s.studentName, grade: s.studentGrade, quizMap: {} };
    if (!studentAvgMap[s.studentName].quizMap[quizKey])
      studentAvgMap[s.studentName].quizMap[quizKey] = [];
    studentAvgMap[s.studentName].quizMap[quizKey].push(s.score);
  });
  const studentRanking = Object.values(studentAvgMap)
    .map((s) => {
      const quizAvgs = Object.values(s.quizMap).map((scores) =>
        Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      );
      return {
        name: s.name,
        grade: s.grade,
        avg: Math.round(quizAvgs.reduce((a, b) => a + b, 0) / quizAvgs.length),
      };
    })
    .sort((a, b) => b.avg - a.avg);
  const topPerformers = studentRanking.filter((s) => s.avg >= 70).slice(0, 3);
  const bottomPerformers = [...studentRanking].sort((a, b) => a.avg - b.avg).slice(0, 3);

  // Group filteredSubmissions by student+assignment for table display
  const tableRows = (() => {
    const byKey = {};
    const rows = [];
    filteredSubmissions.forEach((s) => {
      if (s.assignmentId) {
        const key = `${s.studentName.toLowerCase()}__${s.assignmentId}`;
        if (!byKey[key]) {
          byKey[key] = {
            isGroup: true,
            key,
            studentName: s.studentName,
            studentGrade: s.studentGrade,
            subject: s.subject,
            assignmentId: s.assignmentId,
            createdAt: s.createdAt,
            subs: [],
          };
        }
        byKey[key].subs.push(s);
      } else {
        rows.push({ isGroup: false, key: `solo_${s.id}`, ...s });
      }
    });
    Object.values(byKey).forEach((group) => {
      group.score = Math.round(group.subs.reduce((a, s) => a + s.score, 0) / group.subs.length);
      group.subs.sort((a, b) => (a.assignmentQuestionId || 0) - (b.assignmentQuestionId || 0));
      rows.push(group);
    });
    return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  })();

  // Unique quiz submissions count (for stat card)
  const totalQuizzes = (() => {
    const seen = new Set();
    gradeFiltered.forEach((s) => {
      seen.add(s.assignmentId ? `${s.studentName.toLowerCase()}__${s.assignmentId}` : `solo_${s.id}`);
    });
    return seen.size;
  })();

  const downloadCSV = () => {
    const rows = tableRows.map((row) =>
      `"${row.studentName}","${row.studentGrade || ""}","${row.subject}",${row.score},"${new Date(row.createdAt).toLocaleDateString()}"`
    );
    const csv = ["Student Name,Grade,Subject,Score,Date", ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "grades.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // Student profile view
  if (profileStudent && stats) {
    const profileSubs = [...stats.submissions]
      .filter((s) => s.studentName.toLowerCase() === profileStudent.name.toLowerCase())
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const profileAvg = profileSubs.length > 0
      ? Math.round(profileSubs.reduce((a, s) => a + s.score, 0) / profileSubs.length)
      : 0;

    // Group profile subs by assignment for the table
    const profileRows = (() => {
      const byAssignment = {};
      const rows = [];
      profileSubs.forEach((s) => {
        if (s.assignmentId) {
          if (!byAssignment[s.assignmentId]) {
            byAssignment[s.assignmentId] = {
              isGroup: true,
              key: `asgn_${s.assignmentId}`,
              studentName: s.studentName,
              studentGrade: s.studentGrade,
              subject: s.subject,
              assignmentId: s.assignmentId,
              createdAt: s.createdAt,
              subs: [],
            };
          }
          byAssignment[s.assignmentId].subs.push(s);
        } else {
          rows.push({ isGroup: false, key: `solo_${s.id}`, ...s });
        }
      });
      Object.values(byAssignment).forEach((group) => {
        group.score = Math.round(group.subs.reduce((a, s) => a + s.score, 0) / group.subs.length);
        rows.push(group);
      });
      return rows.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    })();

    const profileTrend = profileRows.map((r) => ({ label: r.subject, score: r.score }));
    return (
      <div className="td-container">
        <div className="td-header">
          <h1 className="td-logo">AutoGrade</h1>
          <button className="td-back-btn" onClick={() => setProfileStudent(null)}>← Back</button>
        </div>
        <div className="td-detail-card">
          <div className="td-detail-top">
            <div>
              <p className="td-label">Student</p>
              <p className="td-value" style={{ fontSize: 20, fontWeight: "bold" }}>{profileStudent.name}</p>
              <p className="td-label">Grade</p>
              <p className="td-value">{profileStudent.grade || "—"}</p>
              <p className="td-label">Submissions</p>
              <p className="td-value">{profileSubs.length}</p>
            </div>
            <div className="td-score-badge" style={{ backgroundColor: scoreColor(profileAvg), color: scoreText(profileAvg), fontSize: 28 }}>
              {profileAvg}/100 avg
            </div>
          </div>
          {profileTrend.length >= 1 && (
            <>
              <p className="td-label" style={{ marginBottom: 10 }}>Score Trend</p>
              <div className="td-chart-box">
                <ScoreLine data={profileTrend} height={140} />
              </div>
            </>
          )}
          <p className="td-label" style={{ marginTop: 20 }}>Quiz History</p>
          <div className="td-table-wrapper" style={{ marginTop: 8 }}>
            <table className="td-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {profileRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.subject}</td>
                    <td>
                      <span className="td-score-pill" style={{ backgroundColor: scoreColor(row.score), color: scoreText(row.score) }}>
                        {row.score}/100
                      </span>
                      {row.isGroup && row.subs.length > 1 && (
                        <span className="td-q-count-badge">{row.subs.length} Qs</span>
                      )}
                    </td>
                    <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="td-view-btn" onClick={() => { setSelected(row); setProfileStudent(null); }}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Submission detail view
  if (selected) {
    const backBtn = <button className="td-back-btn" onClick={() => setSelected(null)}>← Back</button>;
    const header = (
      <div className="td-header">
        <h1 className="td-logo">AutoGrade</h1>
        {backBtn}
      </div>
    );

    if (selected.isGroup) {
      return (
        <div className="td-container">
          {header}
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
                {selected.score}/100{selected.subs.length > 1 ? " avg" : ""}
              </div>
            </div>
            {selected.subs.map((s, i) => {
              const suggestions = s.suggestions ? s.suggestions.split("|").filter(Boolean) : [];
              return (
                <div key={s.id} className="td-q-block">
                  <div className="td-q-block-header">
                    <span className="td-q-block-num">Question {i + 1}</span>
                    <span className="td-score-pill" style={{ backgroundColor: scoreColor(s.score), color: scoreText(s.score) }}>
                      {s.score}/100
                    </span>
                  </div>
                  <p className="td-label">Question</p>
                  <p className="td-value">{s.question}</p>
                  <p className="td-label">Student Answer</p>
                  <textarea className="td-textarea" readOnly value={s.studentAnswer} />
                  <p className="td-label">Feedback</p>
                  <textarea className="td-textarea" readOnly value={s.feedback} />
                  {suggestions.length > 0 && (
                    <>
                      <p className="td-label">Suggestions</p>
                      <ul className="td-suggestions">{suggestions.map((sg, j) => <li key={j}>{sg}</li>)}</ul>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    const suggestions = selected.suggestions ? selected.suggestions.split("|").filter(Boolean) : [];
    return (
      <div className="td-container">
        {header}
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
          {/* Stat Cards */}
          <div className="td-stats-row">
            <div className="td-stat-card">
              <p className="td-stat-number">{totalQuizzes}</p>
              <p className="td-stat-label">Total Submissions</p>
            </div>
            <div className="td-stat-card">
              <p className="td-stat-number">{classAvg}</p>
              <p className="td-stat-label">Class Average</p>
            </div>
            <div className="td-stat-card">
              <p className="td-stat-number" style={{ color: passRate >= 50 ? "#15a315" : "#c90707" }}>
                {passRate}%
              </p>
              <p className="td-stat-label">Pass Rate</p>
            </div>
            <div className="td-stat-card">
              <p className="td-stat-number">{assignments.length}</p>
              <p className="td-stat-label">Assignments</p>
            </div>
            <div className="td-stat-card td-stat-card-highlight">
              <p className="td-stat-number">{enrolledCount}</p>
              <p className="td-stat-label">
                {gradeFilter === "all" ? "Students Enrolled" : `${gradeFilter} Students`}
              </p>
            </div>
          </div>

          {/* Score Distribution */}
          {quizScores.length > 0 && (
            <div className="td-dist-section">
              <p className="td-dist-title">Score Distribution</p>
              {DIST_BANDS.map((band) => {
                const count = quizScores.filter((s) => s >= band.min && s < band.max).length;
                const pct = quizScores.length ? (count / quizScores.length) * 100 : 0;
                return (
                  <div key={band.label} className="td-dist-row">
                    <span className="td-dist-label">{band.label}</span>
                    <div className="td-dist-track">
                      <div className="td-dist-bar" style={{
                        width: `${pct}%`,
                        backgroundColor: band.bg,
                        borderLeft: count > 0 ? `3px solid ${band.color}` : "none",
                      }} />
                    </div>
                    <span className="td-dist-count" style={{ color: band.color }}>{count}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Score Trend Chart */}
          {trendData.length > 0 && (
            <div className="td-chart-section">
              <p className="td-chart-title">
                Class Average by Assignment
                {gradeFilter !== "all" && <span className="td-chart-subtitle"> — {gradeFilter}</span>}
              </p>
              <div className="td-chart-box">
                <ScoreLine data={trendData} />
              </div>
            </div>
          )}

          {/* Top / Bottom Performers */}
          {studentRanking.length >= 2 && (
            <div className="td-performers-row">
              <div className="td-performers-card">
                <p className="td-performers-title">Top Performers</p>
                {topPerformers.map((s, i) => (
                  <div key={i} className="td-performer-item">
                    <span
                      className="td-performer-name td-performer-link"
                      onClick={() => setProfileStudent({ name: s.name, grade: s.grade })}
                    >
                      {i + 1}. {s.name}
                    </span>
                    <span className="td-performer-score" style={{ backgroundColor: scoreColor(s.avg), color: scoreText(s.avg) }}>
                      {s.avg}/100
                    </span>
                  </div>
                ))}
              </div>
              <div className="td-performers-card">
                <p className="td-performers-title">Needs Attention</p>
                {bottomPerformers.map((s, i) => (
                  <div key={i} className="td-performer-item">
                    <span
                      className="td-performer-name td-performer-link"
                      onClick={() => setProfileStudent({ name: s.name, grade: s.grade })}
                    >
                      {s.name}
                    </span>
                    <span className="td-performer-score" style={{ backgroundColor: scoreColor(s.avg), color: scoreText(s.avg) }}>
                      {s.avg}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="td-toolbar">
            <div className="td-toolbar-left">
              <select className="td-grade-filter" value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                <option value="all">All Grades</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <input
                className="td-search-input"
                placeholder="Search student..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
              />
            </div>
            <button className="td-csv-btn" onClick={downloadCSV} disabled={filteredSubmissions.length === 0}>
              Download CSV
            </button>
          </div>

          {tableRows.length === 0 && <p className="td-empty">No submissions yet.</p>}

          {tableRows.length > 0 && (
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
                  {tableRows.map((row) => (
                    <tr key={row.key}>
                      <td>
                        <span
                          className="td-student-link"
                          onClick={() => setProfileStudent({ name: row.studentName, grade: row.studentGrade })}
                        >
                          {row.studentName}
                        </span>
                      </td>
                      <td>{row.studentGrade || "—"}</td>
                      <td>{row.subject}</td>
                      <td>
                        <span className="td-score-pill" style={{ backgroundColor: scoreColor(row.score), color: scoreText(row.score) }}>
                          {row.score}/100
                        </span>
                        {row.isGroup && row.subs.length > 1 && (
                          <span className="td-q-count-badge">{row.subs.length} Qs</span>
                        )}
                      </td>
                      <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td><button className="td-view-btn" onClick={() => setSelected(row)}>View</button></td>
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
            {assignments.map((a) => {
              const aStats = assignmentStats[a.id];
              const qCount = (a.questions || []).length;
              const firstQ = (a.questions || [])[0];
              const enrolled = enrollment?.byGrade?.[a.grade] || 0;
              const submitted = aStats?.count || 0;
              const completionPct = enrolled > 0 ? Math.round((submitted / enrolled) * 100) : null;
              return (
                <div key={a.id} className="td-assign-wrapper">
                  <div className="td-assign-card">
                    <div className="td-assign-left">
                      <p className="td-assign-subject">{a.subject}</p>
                      <div className="td-assign-meta">
                        <span className="td-assign-grade-pill">{a.grade}</span>
                        <span className="td-assign-q-pill">{qCount} question{qCount !== 1 ? "s" : ""}</span>
                        {a.deadline && (
                          <span className="td-assign-deadline">Due: {new Date(a.deadline).toLocaleString()}</span>
                        )}
                      </div>
                      {firstQ && <p className="td-assign-question">{firstQ.questionText}</p>}
                      <div className="td-assign-bottom">
                        <span className="td-assign-date">{new Date(a.createdAt).toLocaleDateString()}</span>
                        {enrolled > 0 ? (
                          <span className="td-assign-completion">
                            {submitted}/{enrolled} submitted
                            {completionPct !== null && (
                              <span className="td-completion-pct" style={{
                                color: completionPct === 100 ? "#15a315" : completionPct >= 50 ? "#c27700" : "#c90707"
                              }}>
                                {" "}({completionPct}%)
                              </span>
                            )}
                          </span>
                        ) : aStats ? (
                          <span className="td-assign-sub-stats">{aStats.count} submitted · Avg {aStats.avg}/100</span>
                        ) : null}
                      </div>
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
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
