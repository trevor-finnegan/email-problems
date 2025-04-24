import React, { useState, useEffect, useRef } from "react";
import "../EmailResponse.css";

const EmailResponse = ({ originalEmail, onClose, accessToken }) => {
  const fromHeader =
    originalEmail?.payload?.headers.find((h) => h.name === "From")?.value || "";
  const subjectHeader =
    originalEmail?.payload?.headers.find((h) => h.name === "Subject")?.value ||
    "";

  const [to, setTo] = useState(fromHeader);
  const [subject, setSubject] = useState(`Re: ${subjectHeader}`);
  const [body, setBody] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.focus();
    }

    if (bodyRef.current) {
      bodyRef.current.style.height = "auto";
      bodyRef.current.style.height = bodyRef.current.scrollHeight + "px";
    }
  }, [body]);

  const handleGenerateDraft = async () => {
    setIsGenerating(true);

    try {
      const messageIdHeader = originalEmail.payload?.headers.find(
        (h) => h.name === "Message-ID"
      )?.value;

      if (!messageIdHeader) {
        alert("Missing Message-ID in email headers.");
        return;
      }

      const res = await fetch(
        `http://localhost:5001/emails/getEmailId?google_message_id=${messageIdHeader}`
      );
      const { id } = await res.json();

      if (!id) {
        alert("Could not find email in database.");
        return;
      }

      const response = await fetch(
        `http://localhost:5001/emails/${id}/respond`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (result.success) {
        setBody(result.response);
      } else {
        alert("Failed to generate draft: " + result.error);
      }
    } catch (err) {
      console.error("Generate draft error:", err);
      alert("Error generating draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    console.log("Access Token being used to send:", accessToken);
    console.log("Sending to:", to);
    console.log("Subject:", subject);
    console.log("Body:", body);
  
    try {
      const response = await fetch('http://localhost:5001/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          accessToken,
        }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        alert('Email sent successfully.');
        onClose();
      } else {
        console.error('Failed to send:', result);
        alert('Failed to send email: ' + result.error);
      }
    } catch (err) {
      console.error('Send email error:', err);
      alert('Error sending email.');
    }
  };
  
  if (!originalEmail) return null;

  return (
    <div className="email-response">
      <h3>Response</h3>

      <div className="field">
        <label>To:</label>
        <input
          type="text"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            e.target.style.setProperty(
              "--input-width",
              `${Math.max(e.target.value.length, 10)}ch`
            );
          }}
          className="email-response-input"
          style={{ "--input-width": "10ch" }} // Fallback value
        />
      </div>

      <div className="field">
        <label>Subject:</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            e.target.style.setProperty('--input-width', `${Math.max(e.target.value.length, 10)}ch`);
          }}
          className="email-response-input"
          style={{ '--input-width': '10ch' }} // Fallback value
        />
      </div>

      <textarea
        ref={bodyRef}
        className="email-body"
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          if (bodyRef.current) {
            bodyRef.current.style.height = "auto"; // Reset height first
            bodyRef.current.style.height = bodyRef.current.scrollHeight + "px"; // Set to full content height
          }
        }}
        placeholder="Compose your message..."
        rows={1}
      />

      <div className="toolbar">
        <button onClick={handleGenerateDraft} disabled={isGenerating}>
          {isGenerating ? "🔄 Generating..." : "Generate"}
        </button>
      </div>

      <div className="action-buttons">
        <button onClick={handleSendEmail}>Send</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EmailResponse;
