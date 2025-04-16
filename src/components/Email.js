import React from "react";
import "../App.css";

const Email = ({ email, onSelectEmail, isSelected }) => {
  const subject =
    email.payload.headers.find((h) => h.name === "Subject")?.value ||
    "No Subject";
  const from =
    email.payload.headers.find((h) => h.name === "From")?.value ||
    "Unknown Sender";

  return (
    <div
      onClick={() => onSelectEmail(email)}
      className={`email-item ${isSelected ? "email-selected" : ""}`}
    >
      {email.isNew && <div className="email-new-dot" />}
      <div className="email-subject">{subject}</div>
      <div className="email-sender">{from}</div>
    </div>
  );
};

export default Email;
