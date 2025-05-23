import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import Reader from "./Reader";
import Sidebar from "./Sidebar";
import {
  emailExists,
  userEmails,
  addEmail,
  getFolders,
  getID,
  getEmails,
} from "../api";
import "../new.css";

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
  const [accessToken, setAccessToken] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [, setIsGapiInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getEmailBody = (payload) => {
    if (!payload) return "";

    let bodyData = "";
    let images = {};

    const findBody = (parts) => {
      for (let part of parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          bodyData = part.body.data;
        } else if (
          part.mimeType === "text/plain" &&
          part.body?.data &&
          !bodyData
        ) {
          bodyData = part.body.data;
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

    if (!bodyData) return "";

    const binaryString = atob(bodyData.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = new Uint8Array(
      [...binaryString].map((char) => char.charCodeAt(0))
    );
    let decodedBody = new TextDecoder("utf-8").decode(bytes);

    Object.keys(images).forEach((attachmentId) => {
      const imageData = `data:${images[attachmentId].mimeType};base64,${images[attachmentId].data}`;
      decodedBody = decodedBody.replace(
        new RegExp(`cid:${attachmentId}`, "g"),
        imageData
      );
    });

    return decodedBody;
  };

  const addEmailToDb = async (emailData) => {
    const headers = emailData?.payload?.headers || [];
    const findHeader = (name) =>
      headers.find((h) => h.name === name)?.value || "";
    let sender_email = findHeader("From");
    const subject = findHeader("Subject");

    if (sender_email.includes("<") && sender_email.includes(">")) {
      sender_email = sender_email.split("<")[1].split(">")[0];
    }

    console.log("Sender email:", sender_email); // Log sender email
    console.log("Subject:", subject); // Log subject

    const authInstance = gapi.auth2.getAuthInstance();
    const userEmail = authInstance.currentUser
      .get()
      .getBasicProfile()
      .getEmail();
    const google_message_id = emailData.id;
    console.log("Google message ID:", google_message_id); // Log Google message ID

    const body = getEmailBody(emailData.payload);

    // Emails automitically added to relevant folders
    let matchingFolderId = null;
    for (const folder of folders) {
      if (folder.id === "inbox") continue; // Skip the inbox folder
      const folderName = folder.name.toLowerCase();
      if (
        subject?.toLowerCase().includes(folderName) ||
        body?.toLowerCase().includes(folderName) ||
        sender_email?.toLowerCase().includes(folderName)
      ) {
        matchingFolderId = folder.id;
        const emailToFolder = {
          type: "email",
          id: emailData.id,
          data: emailData,
        };
        folder.items.push(emailToFolder);
        break;
      }
    }

    const emailDataToSend = {
      sender_email: sender_email,
      google_message_id: google_message_id,
      recipient_email: userEmail,
      subject: subject,
      body: body,
      folder_id: matchingFolderId,
    };

    await addEmail(emailDataToSend); // Send email data to the server
  };

  const mergeWithGmailData = useCallback((currentFolders, emails) => {
    return currentFolders.map((folder) => {
      if (folder.id === "inbox" || folder.name === "Inbox") {
        const emailItems = emails
          .filter((msg) => !msg.folder_id || msg.folder_id === null) // Only inbox emails
          .map((msg) => ({
            type: "email",
            id: msg.id,
            data: msg,
          }));
  
        const existingIds = new Set(folder.items?.map((item) => item.id) || []);
        const newEmails = emailItems.filter((item) => !existingIds.has(item.id));
  
        return { ...folder, items: [...(folder.items || []), ...newEmails] };
      }
  
      if (folder.id === "sent" || folder.name === "Sent") {
        const emailItems = emails
          .filter((msg) => msg.folder_id === folder.id) // Only sent emails
          .map((msg) => ({
            type: "email",
            id: msg.id,
            data: msg,
          }));
  
        const existingIds = new Set(folder.items?.map((item) => item.id) || []);
        const newEmails = emailItems.filter((item) => !existingIds.has(item.id));
  
        return { ...folder, items: [...(folder.items || []), ...newEmails] };
      }
  
      return folder;
    });
  }, []);
  

  // Fetch Gmail messages
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      let allEmails = [];
      let pageToken = null;
      let foundExisting = false;
      const batchSize = 1; // Number of emails to fetch per batch
      let newMessageIDs = new Set();
      const emailLimit = 200;
      let counter = 0;

      // First, fetch emails from Gmail until we find one that exists in our DB
      while (!foundExisting && counter < emailLimit) {
        const params = {
          userId: "me",
          maxResults: batchSize,
          ...(pageToken && { pageToken }),
        };

        const response = await gapi.client.gmail.users.messages.list(params);
        const messages = response.result.messages || [];

        if (messages.length === 0) break;

        // Fetch full details for each message
        const messagePromises = messages.map((msg) =>
          gapi.client.gmail.users.messages.get({ userId: "me", id: msg.id })
        );
        const responses = await Promise.all(messagePromises);
        const emails = responses.map((res) => res.result);

        const messageId = emails[0].id;
        newMessageIDs.add(messageId);

        const emailExistsData = await emailExists(messageId);
        console.log("Email exists check:", emailExistsData, messageId);

        if (messageId && emailExistsData.exists) {
          foundExisting = true;
          break;
        }
        await addEmailToDb(emails[0]);
        const newEmail = { ...emails[0], isNew: true };
        allEmails.push(newEmail);
        counter++;

        if (!foundExisting && response.result.nextPageToken) {
          pageToken = response.result.nextPageToken;
        } else {
          break;
        }
      }

      // Now get all emails from our database
      try {
        const user = gapi.auth2
          .getAuthInstance()
          .currentUser.get()
          .getBasicProfile();
        const email = user.getEmail();
        const dbEmails = await userEmails(email);
        console.log("# DB emails:", dbEmails.length);

        // Convert DB emails to same format as Gmail emails
        const formattedDbEmails = dbEmails.map((email) => ({
          id: email.google_message_id,
          type: "email",
          folder_id: email.folder_id,

          payload: {
            headers: [
              { name: "Subject", value: email.subject },
              { name: "From", value: email.sender_email },
              { name: "To", value: email.recipient_email },
              { name: "Message-ID", value: email.google_message_id },
              { name: "Date", value: email.sent_at },
            ],
            body: {
              data: email.body,
            },
          },
        }));

        for (const email of formattedDbEmails) {
          if (!newMessageIDs.has(email.id)) {
            allEmails.push(email);
          }
        }
        console.log("Fetched emails from DB:", allEmails);
      } catch (error) {
        console.error("Error fetching emails from database:", error);
      }

      // Update folders with the combined emails

      let baseFolders = folders;

// Ensure Inbox exists
if (!folders.some((folder) => folder.id === "inbox")) {
  baseFolders = [
    {
      id: "inbox",
      name: "Inbox",
      items: [],
    },
    ...baseFolders,
  ];
}

// Ensure Sent folder exists
if (!baseFolders.some((folder) => folder.id === "sent")) {
  baseFolders = [
    ...baseFolders,
    {
      id: "sent",
      name: "Sent",
      items: [],
    },
  ];
}

      const mergedFolders = mergeWithGmailData(baseFolders, allEmails);
      updateFolders(mergedFolders);
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
              const user = authInstance.currentUser.get();
              const token = user.getAuthResponse().access_token;
              console.log("Access Token: ", token);
              setAccessToken (token);

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

  useEffect(() => {
    const fetchUserFolders = async () => {
      try {
        const user = gapi.auth2
          .getAuthInstance()
          .currentUser.get()
          .getBasicProfile();
        const email = user.getEmail();
        const userID = await getID(email);
        const userFolders = await getFolders(userID);
        let formattedUserFolders = [];
        for (const folder of userFolders) {
          const currentFolderEmails = await getEmails(folder.id);

          const currentFolderItems = currentFolderEmails.map((email) => ({
            id: email.google_message_id,
            type: "email",
            data: {
              id: email.google_message_id,
              payload: {
                headers: [
                  { name: "Subject", value: email.subject },
                  { name: "From", value: email.sender_email },
                  { name: "To", value: email.recipient_email },
                  { name: "Message-ID", value: email.google_message_id },
                ],
                body: {
                  data: email.body,
                },
              },
            },
          }));

          formattedUserFolders.push({
            id: folder.id,
            name: folder.name,
            type: "folder",
            items: currentFolderItems,
            isDraggable: true,
          });
        }
        console.log("formatted user folders:", formattedUserFolders);
        for (const folder of formattedUserFolders) {
          folders.push(folder);
        }
        console.log("folders:", folders);
      } catch (error) {
        console.error("Failed to fetch folders:", error);
      }
    };

    // Only fetch folders if none are loaded yet
    if (
      folders.length === 1 &&
      folders[0].name === "Inbox" &&
      gapi.auth2 &&
      gapi.auth2.getAuthInstance().isSignedIn.get()
    ) {
      fetchUserFolders();
    }
  }, [folders]);

  // Handlers for folder management
  const handleRenameFolder = (folderId, newName) => {
    onRenameFolder(folderId, newName);
  };

  const handleDeleteFolder = (folderId) => {
    onDeleteFolder(folderId);
  };

  const handleCreateFolder = (folderName, folderId) => {
    onCreateFolder(folderName, folderId);
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
    <div className="home-container">
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
          setFolders={updateFolders}
        />
      )}

      <div className="reader-container">
        <Reader email={selectedEmail} accessToken={accessToken} />
        <button className="signout-button" onClick={handleSignoutClick}>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Home;
