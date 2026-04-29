import React, { useState } from "react";
import "./Auth.css";

const API = "http://localhost:5217";

export default function SignUp({ setPage }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !role || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Sign up failed");
        return;
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => setPage("login"), 1500);
    } catch (err) {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="back" onClick={() => setPage("login")}>
          ← Back to Login
        </div>

        <h1 className="logo">Auto<span>Grade</span></h1>

        <h2>Create Your Account</h2>
        <p className="subtitle">Join AutoGrade and get started</p>

        <input
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <input
          placeholder="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Choose Role</option>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
        {success && <p style={{ color: "green", fontSize: "13px" }}>{success}</p>}

        <button className="primary-btn" onClick={handleSignUp} disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <div className="divider">or</div>

        <p className="bottom-text">
          Already have an account?{" "}
          <span onClick={() => setPage("login")}>Login</span>
        </p>
      </div>
    </div>
  );
}
