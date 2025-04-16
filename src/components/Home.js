import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { gapi } from "gapi-script";
import Reader from "./Reader";
import Sidebar from "./Sidebar";
import { emailExists, userEmails, addEmail, getFolders, getID, getEmails } from "../api";

const API_KEY = "AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-A";
const CLIENT_ID = "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
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

  const getEmailBody = (payload) => {
    if (!payload) return "";

    let bodyData = "";
    let images = {};

    const findBody = (parts) => {
      for (let part of parts) {
        if (part.mimeType === "text/html" && part.body?.data) {
          bodyData = part.body.data;
        } else if (part.mimeType === "text/plain" && part.body?.data && !bodyData) {
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

    const binaryString = atob(bodyData.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array([...binaryString].map((char) => char.charCodeAt(0)));
    let decodedBody = new TextDecoder("utf-8").decode(bytes);

    Object.keys(images).forEach((attachmentId) => {
      const imageData = `data:${images[attachmentId].mimeType};base64,${images[attachmentId].data}`;
      decodedBody = decodedBody.replace(new RegExp(`cid:${attachmentId}`, "g"), imageData);
    });

    return decodedBody;
  };

  const addEmailToDb = async (emailData) => {
    let sender_email = emailData.payload.headers.find(h => h.name === "From")?.value || "";
    let recipient_email = emailData.payload.headers.find(h => h.name === "To")?.value || "";

    const extractEmail = (str) => str.includes("<") ? str.split("<")[1].split(">")[0] : str;

    sender_email = extractEmail(sender_email);
    recipient_email = extractEmail(recipient_email);

    const subject = emailData.payload.headers.find(h => h.name === "Subject")?.value || "";
    const google_message_id = emailData.id;
    const body = getEmailBody(emailData.payload);

    const emailDataToSend = {
      sender_email,
      google_message_id,
      recipient_email,
      subject,
      body,
      folder_id: null,
    };

    await addEmail(emailDataToSend);
  };

  const mergeWithGmailData = useCallback((currentFolders, emails) => {
    return currentFolders.map((folder) => {
      if (folder.id === "inbox" || folder.name === "Inbox") {
        const existingIds = new Set(folder.items?.map((item) => item.id));
        const newEmails = emails
          .map((msg) => ({ type: "email", id: msg.id, data: msg }))
          .filter((item) => !existingIds.has(item.id));
        return { ...folder, items: [...(folder.items || []), ...newEmails] };
      }
      return folder;
    });
  }, []);

  const transformMessagesToFolders = useCallback((messages) => [
    {
      id: "inbox",
      name: "Inbox",
      items: messages.map((msg) => ({ type: "email", id: msg.id, data: msg })),
    },
  ], []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const allEmails = [];
    const newMessageIDs = new Set();
    let foundExisting = false;
    let pageToken = null;

    try {
      const response = await gapi.client.gmail.users.messages.list({ userId: "me", maxResults: 10 });
      const messages = response.result.messages || [];

      if (messages.length > 0) {
        const messageResponses = await Promise.all(
          messages.map((msg) => gapi.client.gmail.users.messages.get({ userId: "me", id: msg.id }))
        );

        const emails = messageResponses.map((res) => res.result);
        const firstId = emails[0]?.id;
        newMessageIDs.add(firstId);

        const exists = await emailExists(firstId);
        if (firstId && exists.exists) {
          foundExisting = true;
        } else {
          await addEmailToDb(emails[0]);
          allEmails.push(emails[0]);
        }
      }

      const user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
      const email = user.getEmail();
      const dbEmails = await userEmails(email);

      dbEmails.forEach((email) => {
        const messageId = email.google_message_id;
        if (!newMessageIDs.has(messageId)) {
          allEmails.push({
            id: messageId,
            payload: {
              headers: [
                { name: "Subject", value: email.subject },
                { name: "From", value: email.sender_email },
                { name: "To", value: email.recipient_email },
                { name: "Message-ID", value: messageId },
              ],
              body: { data: email.body },
            },
          });
        }
      });

      const mergedFolders = folders.length === 0
        ? transformMessagesToFolders(allEmails)
        : mergeWithGmailData(folders, allEmails);

      updateFolders(mergedFolders);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  }, [transformMessagesToFolders, mergeWithGmailData]);

  useEffect(() => {
    const initClient = () => {
      gapi.load("client:auth2", () => {
        gapi.client
          .init({ apiKey: API_KEY, clientId: CLIENT_ID, discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"], scope: SCOPES })
          .then(() => {
            setIsGapiInitialized(true);
            const auth = gapi.auth2.getAuthInstance();
            setIsAuthenticated(auth.isSignedIn.get());
            auth.isSignedIn.listen(setIsAuthenticated);
            if (auth.isSignedIn.get()) fetchMessages();
          })
          .catch((err) => {
            console.error("Error initializing GAPI client:", err);
            alert("Failed to initialize Google API client. Please try again later.");
          });
      });
    };
    initClient();
  }, [fetchMessages, setIsAuthenticated]);

  useEffect(() => {
    const fetchUserFolders = async () => {
      try {
        const user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        const email = user.getEmail();
        const userID = await getID(email);
        const userFolders = await getFolders(userID);

        const formattedUserFolders = await Promise.all(userFolders.map(async (folder) => {
          const currentFolderEmails = await getEmails(folder.id);
          const items = currentFolderEmails.map((email) => ({
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
                body: { data: email.body },
              },
            },
          }));
          return { ...folder, items, type: "folder", isDraggable: true };
        }));

        folders.push(...formattedUserFolders);
      } catch (err) {
        console.error("Failed to fetch folders:", err);
      }
    };

    if (folders.length === 1 && folders[0].name === "Inbox" && gapi.auth2?.getAuthInstance().isSignedIn.get()) {
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
    const auth = gapi.auth2.getAuthInstance();
    if (auth) {
      auth.signOut().then(() => {
        localStorage.removeItem("folders");
        setIsAuthenticated(false);
        navigate("/");
      });
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
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateFolder={onCreateFolder}
          onMoveFolder={onMoveFolder}
          onReorderFolders={onReorderFolders}
          onMoveEmail={onMoveEmail}
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
