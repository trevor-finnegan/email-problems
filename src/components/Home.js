import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import Reader from "./Reader";
import Sidebar from "./Sidebar";

// Access environment variables
const API_KEY = "AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-A";
const CLIENT_ID =
  "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

const Home = ({
  setIsAuthenticated,
  folders,
  updateFolders,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onMoveFolder,
  onReorderFolders,
  onMoveEmail,
}) => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [, setIsGapiInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Function to merge Gmail data with existing folders
  const mergeWithGmailData = useCallback((currentFolders, emails) => {
    return currentFolders.map((folder) => {
      if (folder.id === "inbox" || folder.name === "Inbox") {
        const emailItems = emails.map((msg) => ({
          type: "email",
          id: msg.id,
          data: msg,
        }));

        // Avoid duplicates
        const existingIds = new Set(folder.items?.map((item) => item.id) || []);
        const newEmails = emailItems.filter(
          (item) => !existingIds.has(item.id)
        );

        return { ...folder, items: [...(folder.items || []), ...newEmails] };
      }
      return folder;
    });
  }, []);

  // Convert Gmail messages into a structured folder format
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

  // Fetch Gmail messages
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

        const mergedFolders =
          folders.length === 0
            ? transformMessagesToFolders(emails)
            : mergeWithGmailData(folders, emails);
        updateFolders(mergedFolders);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [transformMessagesToFolders, mergeWithGmailData]);

  // Home.js - fix the useEffect hooks
  useEffect(() => {
    const initClient = () => {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
            ],
            scope: SCOPES,
          })
          .then(() => {
            setIsGapiInitialized(true);
            const authInstance = gapi.auth2.getAuthInstance();
            setIsAuthenticated(authInstance.isSignedIn.get());
            authInstance.isSignedIn.listen(setIsAuthenticated);

            if (authInstance.isSignedIn.get()) {
              fetchMessages();
            }
          })
          .catch((error) => {
            console.error("Error initializing GAPI client:", error);
            alert(
              "Failed to initialize Google API client. Please try again later."
            );
          });
      });
    };

    initClient();
  }, [fetchMessages, setIsAuthenticated]);

  // Handlers for folder management
  const handleRenameFolder = (folderId, newName) => {
    onRenameFolder(folderId, newName);
  };

  const handleDeleteFolder = (folderId) => {
    onDeleteFolder(folderId);
  };

  const handleCreateFolder = (folderName) => {
    onCreateFolder(folderName);
  };

  const handleMoveFolder = (
    sourceParentId,
    destParentId,
    folderId,
    sourceIndex,
    destIndex
  ) => {
    onMoveFolder(
      sourceParentId,
      destParentId,
      folderId,
      sourceIndex,
      destIndex
    );
  };

  const handleReorderFolders = (
    sourceParentId,
    destParentId,
    folderId,
    sourceIndex,
    destIndex
  ) => {
    onReorderFolders(
      sourceParentId,
      destParentId,
      folderId,
      sourceIndex,
      destIndex
    );
  };

  const handleMoveEmail = (emailId, sourceFolderId, destinationFolderId) => {
    onMoveEmail(emailId, sourceFolderId, destinationFolderId);
  };

  const handleSignoutClick = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    if (authInstance) {
      authInstance.signOut().then(() => {
        localStorage.removeItem("folders");
        setIsAuthenticated(false);
        navigate("/");
      });
    } else {
      console.error("Google API client is not initialized.");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {loading ? (
        <div style={{ width: "30%", padding: "10px" }}>
          <h2>Folders</h2>
          <div style={{ padding: "20px" }}>Loading emails...</div>
        </div>
      ) : (
        <Sidebar
          folders={folders}
          onSelectEmail={setSelectedEmail}
          selectedEmail={selectedEmail}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateFolder={handleCreateFolder}
          onMoveFolder={handleMoveFolder}
          onReorderFolders={handleReorderFolders}
          onMoveEmail={handleMoveEmail}
        />
      )}

      <Reader email={selectedEmail} />
      <button
        onClick={handleSignoutClick}
        style={{ position: "absolute", top: 10, right: 10 }}
      >
        Sign out
      </button>
    </div>
  );
};

export default Home;
