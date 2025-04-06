import React from "react";
import DOMPurify from "dompurify";
import PropTypes from 'prop-types';

const getEmailBody = (payload) => {
  if (!payload) return "No content available";

  let bodyData = "";
  let images = {};

  // Recursively find the HTML or plain text part
  const findBody = (parts) => {
    for (let part of parts) {
      if (part.mimeType === "text/html" && part.body.data) {
        bodyData = part.body.data;
      } else if (
        part.mimeType === "text/plain" &&
        part.body.data &&
        !bodyData
      ) {
        bodyData = part.body.data; // Fallback to plain text if no HTML
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

  // Decode Base64 (Gmail uses URL-safe Base64)
  const binaryString = atob(bodyData.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(
    [...binaryString].map((char) => char.charCodeAt(0))
  );
  let decodedBody = new TextDecoder("utf-8").decode(bytes);

  // Replace inline image references (cid:image_id) with actual Base64 data
  Object.keys(images).forEach((attachmentId) => {
    const imageData = `data:${images[attachmentId].mimeType};base64,${images[attachmentId].data}`;
    const regex = new RegExp(`cid:${attachmentId}`, "g");
    decodedBody = decodedBody.replace(regex, imageData);
  });

  return decodedBody;
};

const EmailDetails = ({ email }) => {
  if (!email) {
    return <p>Select an email to view its content.</p>;
  }

  const subject =
    email.payload.headers.find((header) => header.name === "Subject")?.value ||
    "No Subject";
  const from =
    email.payload.headers.find((header) => header.name === "From")?.value ||
    "Unknown Sender";
  const to =
    email.payload.headers.find((header) => header.name === "To")?.value ||
    "Unknown Recipient";
  const date =
    email.payload.headers.find((header) => header.name === "Date")?.value ||
    "Unknown Date";

  let rawBody = getEmailBody(email.payload); // Extracts raw HTML content
  let sanitizedBody = DOMPurify.sanitize(rawBody); // Cleans HTML

  return (
    <div style={{ flex: 1, padding: "20px", overflowY: "auto" }}>
      <h3>{subject}</h3>
      <p>
        <strong>From:</strong> {from}
      </p>
      <p>
        <strong>To:</strong> {to}
      </p>
      <p>
        <strong>Date:</strong> {date}
      </p>
      <hr />
      {/* Render sanitized HTML */}
      <div
        dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        style={{ wordWrap: "break-word" }}
      />
    </div>
  );
};

EmailDetails.propTypes = {
  email: PropTypes.shape({
    payload: PropTypes.shape({
      headers: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string,
          value: PropTypes.string
        })
      ),
      parts: PropTypes.array,
      body: PropTypes.object
    })
  })
};

export default EmailDetails;

