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
        height: "80px", // Fixed height for emails
        padding: "8px",
        cursor: "pointer",
        borderBottom: "1px solid #eee",
        backgroundColor: isSelected ? "#f0f0f0" : "white",
        overflow: "hidden", // Ensure content stays within height
        boxSizing: "border-box", // Include padding in height calculation
        display: "flex", // Ensure the layout aligns correctly
        alignItems: "center",
      }}
    >
      {/* Blue dot if new */}
      {email.isNew && (
        <span
          style={{
            width: "8px",
            height: "8px",
            backgroundColor: "blue",
            borderRadius: "50%",
            marginRight: "10px", // Space between dot and subject
            flexShrink: 0,
          }}
        ></span>
      )}

      <div
        style={{
          fontWeight: "bold",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {subject}
      </div>
      <div
        style={{
          fontSize: "0.9em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {from}
      </div>
    </div>
  );
};

export default Email;

