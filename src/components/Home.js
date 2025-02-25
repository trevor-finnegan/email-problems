import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import Reader from "./Reader";
import Sidebar from "./Sidebar";

const Home = ({ setIsAuthenticated }) => {
  const [folders, setFolders] = useState([]); // Changed from messages to folders
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();

  // Convert Gmail messages to folder structure
  const transformMessagesToFolders = (messages) => {
    return [
      {
        id: "inbox",
        name: "Inbox",
        items: messages.map((msg) => ({
          type: "email",
          id: msg.id,
          data: msg,
        })),
      }
      // Add more default folders here if needed
    ];
  };

  // Wrap fetchMessages in useCallback
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await gapi.client.gmail.users.messages.list({
        userId: "me",
        maxResults: 10,
      });

      const messages = response.result.messages;
      if (messages?.length > 0) {
        const messagePromises = messages.map((msg) =>
          gapi.client.gmail.users.messages.get({ userId: "me", id: msg.id })
        );

        const responses = await Promise.all(messagePromises);
        const emails = responses.map((res) => res.result);
        setFolders(transformMessagesToFolders(emails));
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSignoutClick = () => {
    gapi.auth2
      .getAuthInstance()
      .signOut()
      .then(() => {
        setIsAuthenticated(false);
        navigate("/");
      });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Loading indicator positioned in the sidebar area */}
      {loading && (
        <div style={{ width: '30%', padding: '10px' }}>
          <h2>Folders</h2>
          <div style={{ padding: '20px' }}>Loading emails...</div>
        </div>
      )}
      
      {/* Only show Sidebar when not loading */}
      {!loading && (
        <Sidebar
          folders={folders}
          onSelectEmail={setSelectedEmail}
          selectedEmail={selectedEmail}
        />
      )}

      <Reader email={selectedEmail} />
      <button onClick={handleSignoutClick} style={{ position: 'absolute', top: 10, right: 10 }}>Sign out</button>
    </div>
  );
};

export default Home;
