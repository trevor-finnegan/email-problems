import React from "react";

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
  let decodedBody = atob(bodyData.replace(/-/g, "+").replace(/_/g, "/"));

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
  const body = getEmailBody(email.payload);

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
      {/* Render HTML content */}
      <div
        dangerouslySetInnerHTML={{ __html: body }}
        style={{ wordWrap: "break-word" }}
      />
    </div>
  );
};

export default EmailDetails;
