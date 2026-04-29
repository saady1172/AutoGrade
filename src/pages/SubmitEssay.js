import React, { useState } from "react";
import "./SubmitEssay.css";

export default function SubmitEssay({ goBack, onSubmit }) {

  const [form, setForm] = useState({
    name: "",
    subject: "",
    question: "",
    response: "",
    modelAnswer: ""
  });

  const handleSubmit = async () => {
    try {

      const response = await fetch("http://localhost:5217/api/Grading/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          studentName: form.name,
          subject: form.subject,
          question: form.question,
          studentAnswer: form.response,
          modelAnswer: form.modelAnswer
        })
      });

      if (!response.ok) {
        throw new Error("Server error");
      }

      const result = await response.json();

      console.log("API RESULT:", result); 

      if (!result || result.grade == null) {
        onSubmit(null);
        return;
      }

      onSubmit({
        ...form,
        score: result.grade,
        feedback: result.feedback,
        suggestions: result.suggestions || [],
        modelAnswer: form.modelAnswer
      });

    } catch (error) {
      console.error("API error:", error);

  
      onSubmit(null);

      alert("Error connecting to API");
    }
  };

  return (
    <div className="form-container">

      <h1 className="logo">AutoGrade</h1>

      <input
        type="text"
        placeholder="Student Name"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />

      <input
        type="text"
        placeholder="Subject"
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
      />

      <input
        type="text"
        placeholder="Question"
        onChange={(e) => setForm({ ...form, question: e.target.value })}
      />

      <textarea
        placeholder="Model Answer"
        onChange={(e) => setForm({ ...form, modelAnswer: e.target.value })}
      />

      <textarea
        placeholder="Student Answer"
        onChange={(e) => setForm({ ...form, response: e.target.value })}
      />

      <div className="btn-row">
        <button className="blue-btn" onClick={handleSubmit}>
          Submit
        </button>

        <button className="white-btn" onClick={goBack}>
          Back
        </button>
      </div>

    </div>
  );
}