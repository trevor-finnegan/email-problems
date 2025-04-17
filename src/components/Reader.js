import React, { useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import PropTypes from "prop-types";
import EmailResponse from "./EmailResponse";

const getEmailBody = (payload) => {
  if (!payload) return "No content available";

  let bodyData = "";
  let images = {};

  const findBody = (parts) => {
    for (let part of parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        bodyData = part.body.data;
      } else if (part.mimeType === "text/plain" && part.body.data && !bodyData) {
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
  const [showReply, setShowReply] = useState(false);
  const [summary, setSummary] = useState("Loading summary...");
  const [actionItems, setActionItems] = useState([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingActions, setIsLoadingActions] = useState(false);

  const safeEmail = email || {};
  const subject = safeEmail.payload?.headers?.find((h) => h.name === "Subject")?.value || "No Subject";
  const from = safeEmail.payload?.headers?.find((h) => h.name === "From")?.value || "Unknown Sender";
  const to = safeEmail.payload?.headers?.find((h) => h.name === "To")?.value || "Unknown Recipient";
  const date = safeEmail.payload?.headers?.find((h) => h.name === "Date")?.value || "Unknown Date";
  const rawBody = getEmailBody(safeEmail.payload);
  const sanitizedBody = DOMPurify.sanitize(rawBody);

  const progress = useMemo(() => {
    if (!actionItems.length) return 0;
    const done = actionItems.filter((a) => a.completed).length;
    return Math.round((done / actionItems.length) * 100);
  }, [actionItems]);

  useEffect(() => {
    if (!email) return;

    setSummary("Loading summary...");
    setActionItems([]);
    setIsLoadingSummary(true);
    setIsLoadingActions(true);

    const fetchData = async () => {
      try {
        const messageIdHeader = email?.payload?.headers?.find(h => h.name === "Message-ID")?.value;
        if (!messageIdHeader) return;

        const res = await fetch(`http://localhost:5001/emails/getEmailId?google_message_id=${messageIdHeader}`);
        const { id } = await res.json();
        if (!id) return;

        // Fetch summary
        const summaryRes = await fetch(`http://localhost:5001/emails/${id}/summarize`, { method: "POST" });
        const summaryJson = await summaryRes.json();

        setSummary(summaryJson.success ? summaryJson.summary : "Failed to generate summary.");
        setIsLoadingSummary(false);

        // Fetch action items
        const actionRes = await fetch(`http://localhost:5001/emails/${id}/action-items`, { method: "POST" });
        const actionJson = await actionRes.json();

        if (actionJson.success) {
          let cleaned = actionJson.actionItems.map((item, index) => ({
            id: index + 1,
            text: item.text.replace(/^[-•\d.]*\s*/, "").trim(),
            completed: false
          }));

          // Keep only top 3 or 4 if absolutely needed
          setActionItems(cleaned.slice(0, 4));
        } else {
          setActionItems([]);
        }

      } catch (err) {
        console.error("Error fetching summary/action items:", err);
        setSummary("Unable to generate summary.");
        setActionItems([]);
      } finally {
        setIsLoadingActions(false);
      }
    };

    fetchData();
  }, [email]);

  const handleToggle = (id) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (!email) return <p>Select an email to view its content.</p>;

  return (
    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
      <h3>{subject}</h3>
      <p><strong>From:</strong> {from}</p>
      <p><strong>To:</strong> {to}</p>
      <p><strong>Date:</strong> {date}</p>

      <hr />
      <div style={{ marginTop: "20px" }}>
        <button onClick={() => setShowReply(true)} style={{ marginRight: "10px" }}>Respond</button>
        <button>Mark as Task</button>
      </div>

      <hr />

      {!showReply && (
        <>
          <h4>Summary:</h4>
          <p>{isLoadingSummary ? "Loading..." : summary}</p>

          <h4>Action Items:</h4>
          {isLoadingActions ? (
            <p>Loading action items...</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {actionItems.map((item) => (
                <li key={item.id} style={{ marginBottom: "6px" }}>
                  <label>
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggle(item.id)}
                      style={{ marginRight: "8px" }}
                    />
                    {item.text}
                  </label>
                </li>
              ))}
            </ul>
          )}

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
        </>
      )}

      {showReply && (
        <EmailResponse
          originalEmail={email}
          onClose={() => setShowReply(false)}
        />
      )}

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

