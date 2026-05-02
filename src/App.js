import React, { useState } from "react";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import TeacherDashboard from "./pages/TeacherDashboard";
import CreateAssignment from "./pages/CreateAssignment";
import StudentDashboard from "./pages/StudentDashboard";
import "./App.css";

function App() {
  const [page, setPage] = useState("login");
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    setUser(null);
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
            setPage(userData.role === "teacher" ? "teacher-dashboard" : "student-dashboard");
          }}
        />
      )}

      {page === "signup" && <SignUp setPage={setPage} />}
      {page === "forgot" && <ForgotPassword setPage={setPage} />}

      {page === "teacher-dashboard" && user?.role === "teacher" && (
        <TeacherDashboard
          user={user}
          onLogout={handleLogout}
          onCreateAssignment={() => setPage("create-assignment")}
        />
      )}

      {page === "create-assignment" && user?.role === "teacher" && (
        <CreateAssignment
          onBack={() => setPage("teacher-dashboard")}
          onCreated={() => setPage("teacher-dashboard")}
        />
      )}

      {page === "student-dashboard" && user?.role === "student" && (
        <StudentDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
