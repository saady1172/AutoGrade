import React from "react";
import "./Auth.css";

export default function ForgotPassword({ setPage }) {
  return (
    <div className="auth-wrapper">

      <div className="auth-card">

        <div className="back" onClick={() => setPage("login")}>
          ← Back to Login
        </div>

        <h1 className="logo">Auto<span>Grade</span></h1>

        <h2>Forgot Password?</h2>
        <p className="subtitle">
          No worries! Enter your email and we’ll send you a link
        </p>

        <div className="icon-box">📩</div>

        <input placeholder="Enter your email address" />

        <button className="primary-btn">
          Send Reset Link
        </button>

        <div className="divider">or</div>

        <button
          className="secondary-btn"
          onClick={() => setPage("login")}
        >
          Back to Login
        </button>

        <div className="info-box">
          Didn’t receive the email? <br />
          Check your spam folder or try again.
        </div>

      </div>
    </div>
  );
}