import React, { useEffect, useState } from "react";
import "./StudentDashboard.css";

function MiniScoreLine({ scores }) {
  if (!scores || scores.length < 2) return null;
  const W = 400, H = 80;
  const padL = 28, padR = 10, padT = 12, padB = 10;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xOf = (i) => padL + (i / (scores.length - 1)) * plotW;
  const yOf = (s) => padT + (1 - s / 100) * plotH;
  const pts = scores.map((s, i) => ({ x: xOf(i), y: yOf(s) }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${padT + plotH} L${pts[0].x},${padT + plotH}Z`;
  const trend = scores[scores.length - 1] - scores[0];
  const lineColor = trend > 0 ? "#15a315" : trend < 0 ? "#c90707" : "#1a73e8";
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {[0, 50, 100].map((v) => (
        <line key={v} x1={padL} y1={yOf(v)} x2={padL + plotW} y2={yOf(v)} stroke="#e5e7eb" strokeWidth={1} />
      ))}
      <text x={padL - 4} y={yOf(100) + 4} textAnchor="end" fontSize={9} fill="#ccc">100</text>
      <text x={padL - 4} y={yOf(50) + 4} textAnchor="end" fontSize={9} fill="#ccc">50</text>
      <text x={padL - 4} y={yOf(0) + 4} textAnchor="end" fontSize={9} fill="#ccc">0</text>
      <path d={areaPath} fill={lineColor} opacity={0.08} />
      <path d={linePath} fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={3.5} fill={lineColor} stroke="white" strokeWidth={1.5} />
          <text x={p.x} y={p.y - 6} textAnchor="middle" fontSize={9} fill="#555">{scores[i]}</text>
        </g>
      ))}
    </svg>
  );
}

const API = "http://localhost:5217";

export default function StudentDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("assignments");
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("tabs");
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [answers, setAnswers] = useState({});
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
        setSubmissions(s.filter((x) => x.studentName.toLowerCase() === user.name.toLowerCase()));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [user.name]);

  const scoreColor = (score) => (score < 50 ? "#ffb3b3" : score < 70 ? "#fff0d9" : "#b7ffb7");
  const scoreText  = (score) => (score < 50 ? "#c90707" : score < 70 ? "#c27700" : "#15a315");

  const buildPDFHtml = (subject, date, overallScore, questions) => {
    const sc = (s) => s < 50 ? "#ffb3b3" : s < 70 ? "#fff0d9" : "#b7ffb7";
    const st = (s) => s < 50 ? "#c90707" : s < 70 ? "#c27700" : "#15a315";
    const qHtml = questions.map((q, i) => `
      ${questions.length > 1 ? `<div class="q-num">Question ${i + 1}<span class="q-score" style="background:${sc(q.score)};color:${st(q.score)}">${q.score}/100</span></div>` : ""}
      <div class="label">Question</div><div class="box">${q.question}</div>
      <div class="label">Your Answer</div><div class="box">${q.answer}</div>
      <div class="label">Feedback</div><div class="box">${q.feedback}</div>
      ${q.suggestions.length > 0 ? `<div class="label">Suggestions</div><ul class="sugg">${q.suggestions.map((s) => `<li>${s}</li>`).join("")}</ul>` : ""}
      ${i < questions.length - 1 ? `<hr class="divider">` : ""}
    `).join("");
    return `<!DOCTYPE html><html><head><title>Feedback – ${subject}</title><style>
      *{box-sizing:border-box}body{font-family:Arial,sans-serif;max-width:680px;margin:36px auto;color:#333;font-size:14px}
      h1{color:#1a3d7c;font-size:20px;margin:0 0 4px}
      .meta{color:#888;font-size:12px;margin-bottom:22px}
      .score-badge{display:inline-block;padding:8px 20px;border-radius:8px;font-size:22px;font-weight:bold;background:${sc(overallScore)};color:${st(overallScore)}}
      .avg-label{font-size:12px;color:#888;margin-left:8px}
      .label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;font-weight:600;margin:18px 0 5px}
      .box{background:#f8f9fa;padding:10px 14px;border-radius:6px;border-left:3px solid #1a73e8;line-height:1.6;white-space:pre-wrap}
      .q-num{font-size:13px;font-weight:700;color:#1a73e8;text-transform:uppercase;letter-spacing:.04em;margin-top:22px;display:flex;align-items:center;gap:10px}
      .q-score{padding:3px 10px;border-radius:6px;font-size:13px}
      .divider{border:none;border-top:1px solid #e5e7eb;margin:22px 0}
      .sugg{padding-left:20px;line-height:1.9;margin:0}
      .footer{margin-top:36px;padding-top:12px;border-top:1px solid #eee;font-size:11px;color:#aaa}
      @media print{body{margin:20px}}
    </style></head><body>
      <h1>AutoGrade Feedback Report</h1>
      <div class="meta">${subject} &nbsp;·&nbsp; ${date} &nbsp;·&nbsp; ${user.name}</div>
      <div style="margin-bottom:24px">
        <span class="score-badge">${overallScore}/100</span>
        ${questions.length > 1 ? `<span class="avg-label">overall average</span>` : ""}
      </div>
      ${qHtml}
      <div class="footer">Generated by AutoGrade &nbsp;·&nbsp; ${new Date().toLocaleString()}</div>
    </body></html>`;
  };

  const openPrint = (html) => {
    const win = window.open("", "_blank");
    if (!win) { alert("Allow popups to download the PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  };

  const downloadSubmissionPDF = (sub) => {
    const suggestions = sub.suggestions ? sub.suggestions.split("|").filter(Boolean) : [];
    openPrint(buildPDFHtml(sub.subject, new Date(sub.createdAt).toLocaleDateString(), sub.score,
      [{ question: sub.question, answer: sub.studentAnswer, score: sub.score, feedback: sub.feedback, suggestions }]
    ));
  };

  const downloadGroupPDF = (group) => {
    const questions = group.subs.map((s) => ({
      question: s.question, answer: s.studentAnswer, score: s.score,
      feedback: s.feedback, suggestions: s.suggestions ? s.suggestions.split("|").filter(Boolean) : [],
    }));
    openPrint(buildPDFHtml(group.subject, new Date(group.createdAt).toLocaleDateString(), group.score, questions));
  };

  const downloadResultPDF = () => {
    const qs = result.questions && result.questions.length > 0
      ? result.questions.map((q) => ({
          question: q.questionText, answer: answers[q.questionId] || "",
          score: q.grade, feedback: q.feedback, suggestions: q.suggestions || [],
        }))
      : [{
          question: (activeAssignment?.questions || [])[0]?.questionText || "",
          answer: Object.values(answers)[0] || "",
          score: result.grade, feedback: result.feedback, suggestions: result.suggestions || [],
        }];
    openPrint(buildPDFHtml(
      activeAssignment?.subject || "Assignment",
      new Date().toLocaleDateString(),
      result.grade, qs
    ));
  };

  const submittedAssignmentIds = new Set(
    submissions.filter((s) => s.assignmentId != null).map((s) => s.assignmentId)
  );

  // Group My Grades by assignmentId
  const gradeGroups = (() => {
    const byAssignment = {};
    const solo = [];
    submissions.forEach((s) => {
      if (s.assignmentId) {
        if (!byAssignment[s.assignmentId]) byAssignment[s.assignmentId] = [];
        byAssignment[s.assignmentId].push(s);
      } else {
        solo.push(s);
      }
    });
    const groups = Object.values(byAssignment).map((subs) => ({
      assignmentId: subs[0].assignmentId,
      subject: subs[0].subject,
      score: Math.round(subs.reduce((a, s) => a + s.score, 0) / subs.length),
      subs,
      createdAt: subs[0].createdAt,
      multi: subs.length > 1,
    }));
    solo.forEach((s) =>
      groups.push({ assignmentId: null, subject: s.subject, score: s.score, subs: [s], createdAt: s.createdAt, multi: false })
    );
    return groups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  })();

  const avgScore =
    submissions.length > 0
      ? Math.round(submissions.reduce((a, s) => a + s.score, 0) / submissions.length)
      : null;

  const handleSubmitAnswer = async () => {
    setSubmitLoading(true);
    try {
      const res = await fetch(`${API}/api/grading/student-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: activeAssignment.id,
          studentName: user.name,
          studentGrade: user.grade || "",
          answers: (activeAssignment.questions || []).map((q) => ({
            questionId: q.id,
            answer: answers[q.id] || "",
          })),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.message || "Submission failed.");
        setView("tabs");
        setActiveAssignment(null);
        setAnswers({});
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

  // Group detail view (multi-question grades)
  if (view === "group-detail" && activeGroup) {
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => { setView("tabs"); setActiveGroup(null); }}>
            ← Back to Grades
          </button>
        </div>
        <div className="sd-detail-card">
          <div className="sd-detail-top">
            <div>
              <p className="sd-detail-label">Subject</p>
              <p className="sd-detail-value">{activeGroup.subject}</p>
            </div>
            <div className="sd-score-badge" style={{ backgroundColor: scoreColor(activeGroup.score), color: scoreText(activeGroup.score) }}>
              {activeGroup.score}/100 avg
            </div>
          </div>
          {activeGroup.subs.map((s, i) => {
            const suggestions = s.suggestions ? s.suggestions.split("|").filter(Boolean) : [];
            return (
              <div key={s.id} className="sd-question-block">
                <p className="sd-question-num">Question {i + 1}</p>
                <p className="sd-detail-label">Question</p>
                <p className="sd-question-text">{s.question}</p>
                <div className="sd-q-score-row">
                  <span className="sd-detail-label">Score</span>
                  <span className="sd-score-pill-sm" style={{ backgroundColor: scoreColor(s.score), color: scoreText(s.score) }}>
                    {s.score}/100
                  </span>
                </div>
                <p className="sd-detail-label">Your Answer</p>
                <textarea className="sd-textarea" readOnly value={s.studentAnswer} />
                <p className="sd-detail-label">Feedback</p>
                <textarea className="sd-textarea" readOnly value={s.feedback} />
                {suggestions.length > 0 && (
                  <>
                    <p className="sd-detail-label">Suggestions</p>
                    <ul className="sd-suggestions">{suggestions.map((sg, j) => <li key={j}>{sg}</li>)}</ul>
                  </>
                )}
              </div>
            );
          })}
          <button className="sd-pdf-btn" onClick={() => downloadGroupPDF(activeGroup)}>
            Download Feedback as PDF
          </button>
        </div>
      </div>
    );
  }

  // Past submission detail (single question)
  if (view === "detail" && activeSubmission) {
    const suggestions = activeSubmission.suggestions
      ? activeSubmission.suggestions.split("|").filter(Boolean)
      : [];
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => { setView("tabs"); setActiveSubmission(null); }}>
            ← Back to Grades
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
          <button className="sd-pdf-btn" onClick={() => downloadSubmissionPDF(activeSubmission)}>
            Download Feedback as PDF
          </button>
        </div>
      </div>
    );
  }

  // Answer submission form
  if (view === "submit" && activeAssignment) {
    const qs = activeAssignment.questions || [];
    const canSubmit = qs.length > 0 && qs.every((q) => (answers[q.id] || "").trim().length > 0);
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
          <button className="sd-back-btn" onClick={() => { setView("tabs"); setActiveAssignment(null); setAnswers({}); }}>
            ← Back
          </button>
        </div>
        <div className="sd-detail-card">
          <p className="sd-detail-label">Subject</p>
          <p className="sd-detail-value">{activeAssignment.subject}</p>
          {activeAssignment.deadline && (
            <p className="sd-card-deadline">Due: {new Date(activeAssignment.deadline).toLocaleString()}</p>
          )}
          {qs.map((q, i) => (
            <div key={q.id} className="sd-question-block">
              <p className="sd-question-num">Question {i + 1}</p>
              <p className="sd-question-text">{q.questionText}</p>
              <p className="sd-detail-label">Your Answer</p>
              <textarea
                className="sd-textarea sd-answer-input"
                placeholder="Write your answer here..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
              />
            </div>
          ))}
          <button
            className="sd-submit-btn"
            onClick={handleSubmitAnswer}
            disabled={submitLoading || !canSubmit}
          >
            {submitLoading ? "Grading..." : `Submit Answer${qs.length > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    );
  }

  // Result after grading
  if (view === "result" && result) {
    const hasQuestions = result.questions && result.questions.length > 0;
    return (
      <div className="sd-container">
        <div className="sd-header">
          <h1 className="sd-logo">AutoGrade</h1>
        </div>
        <div className="sd-detail-card">
          <h2 className="sd-result-title">Graded!</h2>
          <div className="sd-score-badge sd-score-center" style={{ backgroundColor: scoreColor(result.grade), color: scoreText(result.grade) }}>
            {result.grade}/100{hasQuestions && result.questions.length > 1 ? " avg" : ""}
          </div>
          {hasQuestions ? (
            result.questions.map((q, i) => (
              <div key={q.questionId} className="sd-question-block">
                <p className="sd-question-num">Question {i + 1}</p>
                <p className="sd-detail-label">Question</p>
                <p className="sd-question-text">{q.questionText}</p>
                <div className="sd-q-score-row">
                  <span className="sd-detail-label">Score</span>
                  <span className="sd-score-pill-sm" style={{ backgroundColor: scoreColor(q.grade), color: scoreText(q.grade) }}>
                    {q.grade}/100
                  </span>
                </div>
                <p className="sd-detail-label">Feedback</p>
                <textarea className="sd-textarea" readOnly value={q.feedback} />
                {q.suggestions && q.suggestions.length > 0 && (
                  <>
                    <p className="sd-detail-label">Suggestions</p>
                    <ul className="sd-suggestions">{q.suggestions.map((s, j) => <li key={j}>{s}</li>)}</ul>
                  </>
                )}
              </div>
            ))
          ) : (
            <>
              <p className="sd-detail-label">Feedback</p>
              <textarea className="sd-textarea" readOnly value={result.feedback} />
              {result.suggestions && result.suggestions.length > 0 && (
                <>
                  <p className="sd-detail-label">Suggestions</p>
                  <ul className="sd-suggestions">{result.suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </>
              )}
            </>
          )}
          <div className="sd-result-actions">
            <button className="sd-pdf-btn" onClick={downloadResultPDF}>
              Download Feedback as PDF
            </button>
            <button
              className="sd-submit-btn"
              onClick={() => { setView("tabs"); setTab("grades"); setResult(null); setActiveAssignment(null); setAnswers({}); }}
            >
              View My Grades
            </button>
          </div>
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
          {assignments.length > 0 && (
            <div className="sd-progress-section">
              <div className="sd-progress-header">
                <span className="sd-progress-text">
                  {submittedAssignmentIds.size} of {assignments.length} assignment{assignments.length !== 1 ? "s" : ""} submitted
                </span>
              </div>
              <div className="sd-progress-track">
                <div
                  className="sd-progress-fill"
                  style={{ width: `${(submittedAssignmentIds.size / assignments.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          {assignments.length === 0 && <p className="sd-empty">No assignments yet. Check back later!</p>}
          <div className="sd-list">
            {assignments.map((a) => {
              const isSubmitted = submittedAssignmentIds.has(a.id);
              const isPastDeadline = a.deadline && new Date(a.deadline) < new Date();
              const qCount = (a.questions || []).length;
              return (
                <div key={a.id} className="sd-card" style={{ cursor: "default" }}>
                  <div className="sd-card-left">
                    <p className="sd-card-subject">{a.subject}</p>
                    <p className="sd-card-question">
                      {qCount} question{qCount !== 1 ? "s" : ""}
                      {qCount > 0 ? ` · ${(a.questions[0].questionText || "").substring(0, 60)}${(a.questions[0].questionText || "").length > 60 ? "…" : ""}` : ""}
                    </p>
                    {a.deadline && (
                      <p className="sd-card-deadline">Due: {new Date(a.deadline).toLocaleString()}</p>
                    )}
                    <p className="sd-card-date">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                  {isSubmitted ? (
                    <span className="sd-status-badge sd-submitted">Submitted ✓</span>
                  ) : isPastDeadline ? (
                    <span className="sd-status-badge sd-closed">Closed</span>
                  ) : (
                    <button
                      className="sd-answer-btn"
                      onClick={() => {
                        const initAnswers = {};
                        (a.questions || []).forEach((q) => { initAnswers[q.id] = ""; });
                        setActiveAssignment(a);
                        setAnswers(initAnswers);
                        setView("submit");
                      }}
                    >
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
          {avgScore !== null && (
            <div className="sd-avg-row">
              <span className="sd-avg-label">Your Average</span>
              <span
                className="sd-avg-score"
                style={{ backgroundColor: scoreColor(avgScore), color: scoreText(avgScore) }}
              >
                {avgScore}/100
              </span>
            </div>
          )}
          {gradeGroups.length >= 2 && (
            <div className="sd-trend-box">
              <p className="sd-trend-label">
                Score Trend
                {(() => {
                  const scores = [...gradeGroups].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(g => g.score);
                  const diff = scores[scores.length - 1] - scores[0];
                  if (diff > 0) return <span style={{ color: "#15a315", marginLeft: 8 }}>↑ Improving</span>;
                  if (diff < 0) return <span style={{ color: "#c90707", marginLeft: 8 }}>↓ Declining</span>;
                  return <span style={{ color: "#888", marginLeft: 8 }}>→ Stable</span>;
                })()}
              </p>
              <MiniScoreLine
                scores={[...gradeGroups]
                  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                  .map(g => g.score)}
              />
            </div>
          )}
          {gradeGroups.length === 0 && <p className="sd-empty">No grades yet. Submit an answer first!</p>}
          <div className="sd-list">
            {gradeGroups.map((g, i) => (
              <div
                key={i}
                className="sd-card"
                onClick={() => {
                  if (g.multi) {
                    setActiveGroup(g);
                    setView("group-detail");
                  } else {
                    setActiveSubmission(g.subs[0]);
                    setView("detail");
                  }
                }}
              >
                <div className="sd-card-left">
                  <p className="sd-card-subject">{g.subject}</p>
                  <p className="sd-card-question">
                    {g.multi
                      ? `${g.subs.length} questions`
                      : g.subs[0].question}
                  </p>
                  <p className="sd-card-date">{new Date(g.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="sd-card-score" style={{ backgroundColor: scoreColor(g.score), color: scoreText(g.score) }}>
                  {g.score}/100{g.multi ? " avg" : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
