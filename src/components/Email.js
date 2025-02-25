import React from "react";

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
      style={{
        padding: "8px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
        backgroundColor: isSelected ? "#f0f0f0" : "white",
        "&:hover": { backgroundColor: "#f5f5f5" },
      }}
    >
      <div><strong>{subject}</strong></div>
      <div style={{ fontSize: '0.9em' }}>{from}</div>
    </div>
  );
};

export default Email;
