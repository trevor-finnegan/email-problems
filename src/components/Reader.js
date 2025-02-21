import React from 'react';

const getEmailBody = (payload) => {
  if (!payload) return 'No content available';

  if (payload.parts) {
    for (let part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body.data) {
        return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      }
    }
  }

  if (payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
  }

  return 'No content available';
};

const EmailDetails = ({ email }) => {
  if (!email) {
    return <p>Select an email to view its content.</p>;
  }

  const subject = email.payload.headers.find(header => header.name === 'Subject')?.value || 'No Subject';
  const from = email.payload.headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
  const to = email.payload.headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
  const date = email.payload.headers.find(header => header.name === 'Date')?.value || 'Unknown Date';
  const body = getEmailBody(email.payload);

  return (
    <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
      <h3>{subject}</h3>
      <p><strong>From:</strong> {from}</p>
      <p><strong>To:</strong> {to}</p>
      <p><strong>Date:</strong> {date}</p>
      <hr />
      <pre style={{ whiteSpace: 'pre-wrap' }}>{body}</pre>
    </div>
  );
};

export default EmailDetails;
