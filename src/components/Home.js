import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import Reader from "./Reader";
import Sidebar from "./Sidebar";

// Access environment variables
const API_KEY = "AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-А";
const CLIENT_ID = "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

const Home = ({ setIsAuthenticated, folders, onRenameFolder, onDeleteFolder, onCreateFolder }) => {
  const [localFolders, setLocalFolders] = useState(folders);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [, setIsGapiInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to merge Gmail data with existing folders structure
  const mergeWithGmailData = useCallback(
    (emails) => {
      return localFolders.map((folder) => {
        if (folder.id === "inbox" || folder.name === "Inbox") {
          // Add emails to the Inbox folder
          const emailItems = emails.map((msg) => ({
            type: "email",
            id: msg.id,
            data: msg,
          }));

          const existingEmails = folder.items || [];
          if(JSON.stringify(existingEmails) === JSON.stringify(emailItems)) {
            return folder;
          }

          return {
            ...folder,
            items: [...(folder.items || []), ...emailItems],
          };
        }
        return folder;
      });
    },
    [localFolders]
  );

  // Convert Gmail messages to folder structure
  const transformMessagesToFolders = useCallback((messages) => {
    return [
      {
        id: "inbox",
        name: "Inbox",
        items: messages.map((msg) => ({
          type: "email",
          id: msg.id,
          data: msg,
        })),
      },
    ];
  }, []);

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

        // If localFolders is empty, initialize it with the transformed data
        setLocalFolders((current) => {
          if (current.length === 0) {
            return transformMessagesToFolders(emails);
          }
          return current;
        });
        const updatedFolders = mergeWithGmailData(emails);
        return JSON.stringify(updatedFolders) === JSON.stringify(localFolders) ? localFolders : updatedFolders;

      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [localFolders, mergeWithGmailData, transformMessagesToFolders]);

  useEffect(() => {
    const storedFolders = localStorage.getItem("folders");
    if (storedFolders) {
      setLocalFolders(JSON.parse(storedFolders));
    }
    const initClient = () => {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
            scope: SCOPES,
          })
          .then(() => {
            setIsGapiInitialized(true); // Mark GAPI as initialized
            const authInstance = gapi.auth2.getAuthInstance();
            setIsAuthenticated(authInstance.isSignedIn.get());
            authInstance.isSignedIn.listen(setIsAuthenticated);

            // Fetch messages only after GAPI is initialized
            if(authInstance.isSignedIn.get()) {
              fetchMessages();
            }
            
          })
          .catch((error) => {
            console.error("Error initializing GAPI client:", error);
            // Show an error message to the user
            alert("Failed to initialize Google API client. Please try again later.");
          });
      });
    };

    initClient();
  }, [fetchMessages, setIsAuthenticated]);
  
  const handleRenameFolder = (folderId, newName) => {
    onRenameFolder(folderId, newName);
    setLocalFolders((prev) =>
      prev.map((folder) =>
        folder.id === folderId ? { ...folder, name: newName } : folder
      )
    );
  };
  
  const handleDeleteFolder = (folderId) => {
    onDeleteFolder(folderId);
    setLocalFolders((prev) => prev.filter((folder) => folder.id !== folderId));
  };
  
  const handleCreateFolder = (folderName) => {
    setLocalFolders([...localFolders, { id: Date.now(), name: folderName, items: [] }]);
  };  
  
  const handleSignoutClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance.signOut().then(() => {
        localStorage.removeItem("folders"); // Clear saved folders
        setIsAuthenticated(false);
        navigate("/");
      });
    } else {
      console.error("Google API client is not initialized.");
    }
  };  

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Loading indicator positioned in the sidebar area */}
      {loading && (
        <div style={{ width: "30%", padding: "10px" }}>
          <h2>Folders</h2>
          <div style={{ padding: "20px" }}>Loading emails...</div>
          <p>Loadings emails...</p>
        </div>
      )}

      {/* Only show Sidebar when not loading */}
      {!loading && (
        <Sidebar
          folders={localFolders}
          onSelectEmail={setSelectedEmail}
          selectedEmail={selectedEmail}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateFolder={handleCreateFolder}
        />
      )}

      <Reader email={selectedEmail} />
      <button onClick={handleSignoutClick} style={{ position: "absolute", top: 10, right: 10 }}>
        Sign out
      </button>
    </div>
  );
};

export default Home;
