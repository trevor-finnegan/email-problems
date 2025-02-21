import React from 'react';

const Reader = ({ email }) => {
  if (!email) {
    return <p>Select an email to view its content.</p>;
  }

  const subject = email.payload.headers.find(header => header.name === 'Subject')?.value || 'No Subject';
  const from = email.payload.headers.find(header => header.name === 'From')?.value || 'Unknown Sender';
  const to = email.payload.headers.find(header => header.name === 'To')?.value || 'Unknown Recipient';
  const date = email.payload.headers.find(header => header.name === 'Date')?.value || 'Unknown Date';

  return (
    <div style={{ flex: 1, padding: '20px' }}>
      <h3>{subject}</h3>
      <p><strong>From:</strong> {from}</p>
      <p><strong>To:</strong> {to}</p>
      <p><strong>Date:</strong> {date}</p>
      <hr />
      <p>{email.snippet}</p>
    </div>
  );
};

export default Reader;
