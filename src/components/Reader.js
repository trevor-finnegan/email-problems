import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import PropTypes from "prop-types";

const getEmailBody = (payload) => {
  if (!payload) return "No content available";

  let bodyData = "";
  let images = {};

  const findBody = (parts) => {
    for (let part of parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        bodyData = part.body.data;
      } else if (
        part.mimeType === "text/plain" &&
        part.body.data &&
        !bodyData
      ) {
        bodyData = part.body.data;
      } else if (part.mimeType?.startsWith("image/")) {
        images[part.body.attachmentId] = {
          mimeType: part.mimeType,
          data: part.body.data,
        };
      } else if (part.parts) {
        findBody(part.parts);
      }
    }
  };

  if (payload.parts) {
    findBody(payload.parts);
  } else if (payload.body?.data) {
    bodyData = payload.body.data;
  }

  if (!bodyData) return "No content available";

  try {
    const binaryString = atob(bodyData.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
    return new TextDecoder("utf-8").decode(bytes);
  } catch (e) {
    return bodyData;
  }
};

const EmailDetails = ({ email }) => {
  if (!email) {
    return <p>Select an email to view its content.</p>;
  }

  const subject =
    email.payload?.headers?.find((h) => h.name === "Subject")?.value || "No Subject";
  const from =
    email.payload?.headers?.find((h) => h.name === "From")?.value || "Unknown Sender";
  const to =
    email.payload?.headers?.find((h) => h.name === "To")?.value || "Unknown Recipient";
  const date =
    email.payload?.headers?.find((h) => h.name === "Date")?.value || "Unknown Date";

  const rawBody = getEmailBody(email.payload);
  const sanitizedBody = DOMPurify.sanitize(rawBody);

  // Sample placeholder summary and actions (you can replace with actual props/data)
  const summary = email.summary || "This email informs you about scheduled system maintenance, including the date, time, and potential service disruptions...";
  const actionItems = email.actionItems || [
    { id: 1, text: "Review Attached Document", completed: false },
    { id: 2, text: "Update Project Status", completed: true },
    { id: 3, text: "Schedule Follow-Up Meeting", completed: false },
  ];

  const progress = useMemo(() => {
    if (!actionItems.length) return 0;
    const done = actionItems.filter((a) => a.completed).length;
    return Math.round((done / actionItems.length) * 100);
  }, [actionItems]);

  return (
    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
      <h3>{subject}</h3>
      <p><strong>From:</strong> {from}</p>
      <p><strong>To:</strong> {to}</p>
      <p><strong>Date:</strong> {date}</p>

      <hr />
      <h4>Summary:</h4>
      <p>{summary}</p>

      <h4>Action Items:</h4>
      <ul>
        {actionItems.map((item) => (
          <li key={item.id}>
            {item.completed ? "✓" : "[ ]"} {item.text}
          </li>
        ))}
      </ul>

      <div style={{ margin: "10px 0" }}>
        <strong>Progress:</strong> {progress}%
        <div style={{
          background: "#ddd", borderRadius: "8px", overflow: "hidden", height: "20px", marginTop: "4px"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            background: "#4caf50"
          }} />
        </div>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button style={{ marginRight: "10px" }}>Respond</button>
        <button style={{ marginRight: "10px" }}>View Original</button>
        <button>Mark as Task</button>
      </div>

      <hr />
      <div
        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        style={{ marginTop: "20px" }}
      />
    </div>
  );
};

EmailDetails.propTypes = {
  email: PropTypes.shape({
    payload: PropTypes.object,
    summary: PropTypes.string,
    actionItems: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number,
        text: PropTypes.string,
        completed: PropTypes.bool,
      })
    ),
  }),
};

export default EmailDetails;
