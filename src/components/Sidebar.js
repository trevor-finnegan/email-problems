import React from 'react';

const Sidebar = ({ messages, onSelectEmail, selectedEmail }) => {
  return (
    <div style={{ width: '30%', overflowY: 'auto', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h2>Your Emails</h2>
      {messages.length > 0 ? (
        messages.map((message, index) => {
          const subject = message.payload.headers.find(header => header.name === 'Subject')?.value || 'No Subject';
          const from = message.payload.headers.find(header => header.name === 'From')?.value || 'Unknown Sender';

          return (
            <div
              key={index}
              onClick={() => onSelectEmail(message)}
              style={{
                padding: '10px',
                borderBottom: '1px solid #ddd',
                cursor: 'pointer',
                backgroundColor: selectedEmail === message ? '#f0f0f0' : 'white'
              }}
            >
              <p><strong>Subject:</strong> {subject}</p>
              <p><strong>From:</strong> {from}</p>
            </div>
          );
        })
      ) : (
        <p>No messages found.</p>
      )}
    </div>
  );
};

export default Sidebar;
