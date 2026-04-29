import React, { useState } from "react";
import SubmitEssay from "./pages/SubmitEssay";
import Feedback from "./pages/Feedback";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import StudentDashboard from "./pages/StudentDashboard";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [feedbackData, setFeedbackData] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
    setFeedbackData(null);
    setPage("login");
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>

      <button
        className="dark-toggle"
        onClick={() => setDarkMode(!darkMode)}
      >
        {darkMode ? "☀ Light Mode" : "🌙 Dark Mode"}
      </button>

      {page === "login" && (
        <Login
          setPage={setPage}
          onLogin={(userData) => {
            setUser(userData);
            if (userData.role === "teacher") {
              setPage("submit");
            } else {
              setPage("student-dashboard");
            }
          }}
        />
      )}

      {page === "signup" && <SignUp setPage={setPage} />}

      {page === "forgot" && <ForgotPassword setPage={setPage} />}

      {page === "submit" && user?.role === "teacher" && (
        <SubmitEssay
          goBack={handleLogout}
          onSubmit={(data) => {
            setFeedbackData(data);
            setPage("feedback");
          }}
        />
      )}

      {page === "feedback" && user?.role === "teacher" && (
        <Feedback
          data={feedbackData}
          tryAgain={() => setPage("submit")}
        />
      )}

      {page === "student-dashboard" && user?.role === "student" && (
        <StudentDashboard user={user} onLogout={handleLogout} />
      )}

    </div>
  );
}

export default App;
