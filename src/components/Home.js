import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {gapi} from 'gapi-script';

const Home = ( {setIsAuthenticated }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
      });

      const messages = response.result.messages;
      if (messages && messages.length > 0) {
        const messagePromises = messages.map((msg) =>
          gapi.client.gmail.users.messages.get({ userId: 'me', id: msg.id })
        );

        const responses = await Promise.all(messagePromises);
        setMessages(responses.map((res) => res.result));
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
    setLoading(false);
  };

  const handleSignoutClick = () => {
    gapi.auth2.getAuthInstance().signOut().then(() => {
      setIsAuthenticated(false);
      navigate('/');
    });
  };

  return (
    <div>
      <h2>Your Emails</h2>
      <button onClick={handleSignoutClick}>Sign out</button>
      {loading ? (
        <p>Loading emails...</p>
      ) : messages.length > 0 ? (
        messages.map((message, index) => (
          <div key={index}>
            <p>
              <strong>Subject:</strong> {message.payload.headers.find(header => header.name === 'Subject')?.value || 'No Subject'}
            </p>
            <p>
              <strong>From:</strong> {message.payload.headers.find(header => header.name === 'From')?.value || 'Unknown Sender'}
            </p>
          </div>
        ))
      ) : (
        <p>No messages found.</p>
      )}
    </div>
  );
};

export default Home;
