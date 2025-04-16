import React, { useState } from "react";
import "../EmailResponse.css";

const EmailResponse = ({ originalEmail, onClose }) => {
  if (!originalEmail) return null;

  const fromHeader = originalEmail?.payload?.headers.find(h => h.name === "From")?.value || "";
  const subjectHeader = originalEmail?.payload?.headers.find(h => h.name === "Subject")?.value || "";

  const [to, setTo] = useState(fromHeader);
  const [subject, setSubject] = useState(`Re: ${subjectHeader}`);
  const [body, setBody] = useState("");

  return (
    <div className="email-response">
      <h3>Response</h3>

      <div className="field">
        <label>To:</label>
        <input type="text" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      <div className="field">
        <label>Subject:</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} />
      </div>

      <textarea
        className="email-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Compose your message..."
      />

      <div className="toolbar">
        <button>Generate</button>
        <button><b>B</b></button>
        <button><i>I</i></button>
        <button><u>U</u></button>
        <button><s>S</s></button>
        <select>
          <option>style</option>
          <option>Heading</option>
          <option>Quote</option>
        </select>
        <button>• List</button>
        <button>1. List</button>
        <button>↺</button>
        <button>↻</button>
        <button>🖼️</button>
        <button>🙂</button>
      </div>

      <div className="action-buttons">
        <button>Save Draft</button>
        <button>Send</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default EmailResponse;
