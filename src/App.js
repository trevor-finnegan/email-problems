import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { gapi } from "gapi-script";
import Home from "./components/Home";
import Login from "./components/Login";
import "./App.css";

const CLIENT_ID = "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
const API_KEY = "AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-A";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [folders, setFolders] = useState([
    {
      id: "inbox",
      name: "Inbox",
      type: "folder",
      items: [],
      isDraggable: false,
    },
  ]);

  useEffect(() => {
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
            const authInstance = gapi.auth2.getAuthInstance();
            setIsAuthenticated(authInstance.isSignedIn.get());
            authInstance.isSignedIn.listen(setIsAuthenticated);
          });
      });
    };

    initClient();
  }, []);

  const handleRenameFolder = (folderId, newName) => {
    const renameFolder = (items) =>
      items.map((item) =>
        item.id === folderId
          ? { ...item, name: newName }
          : item.type === "folder"
          ? { ...item, items: renameFolder(item.items) }
          : item
      );
    setFolders(renameFolder(folders));
  };

  const handleDeleteFolder = (folderId) => {
    const deleteFolder = (items) =>
      items.filter((item) =>
        item.id === folderId ? false : item.type === "folder" ? { ...item, items: deleteFolder(item.items) } : true
      );
    setFolders(deleteFolder(folders));
  };

  const handleCreateFolder = (parentFolderId, folderName) => {
    setFolders((prevFolders) => {
      const newFolder = {
        id: Date.now().toString(),
        name: folderName,
        type: "folder",
        items: [],
      };  

      if(parentFolderId === 'inbox'){
        return [...prevFolders, newFolder];
      }

      const addFolder = (items) => {
        return items.map((item) => {
          if(item.id === parentFolderId){
            return { ...item, items: [...item.items, newFolder] };
          }
          if(item.type === 'folder'){
            return { ...item, items: addFolder(item.items) };
          }
          return item;
        });
      };

      return JSON.parse(JSON.stringify(addFolder(prevFolders)));
    });
  };

  // 🏗️ Move a folder to a new parent folder
  const handleMoveFolder = (folderId, newParentId) => {
    if (folderId === "inbox") return; // Inbox cannot be moved

    let movedFolder = null;

    const removeFolder = (items) =>
      items.filter((item) => {
        if (item.id === folderId) {
          movedFolder = item;
          return false;
        }
        if (item.type === "folder") {
          return { ...item, items: removeFolder(item.items) };
        }
        return true;
      });

    const updatedFolders = removeFolder(folders);

    const addFolder = (items) =>
      items.map((item) =>
        item.id === newParentId ? { ...item, items: [...item.items, movedFolder] } : item
      );

    setFolders(addFolder(updatedFolders));
  };

  // 🔄 Reorder folders within the same parent
  const handleReorderFolders = (folderId, newIndex) => {
    setFolders((prevFolders) => {
      const parentFolders = [...prevFolders];
      const folderIndex = parentFolders.findIndex((f) => f.id === folderId);
      if (folderIndex === -1 || newIndex < 0 || newIndex >= parentFolders.length) return prevFolders;

      const [movedFolder] = parentFolders.splice(folderIndex, 1);
      parentFolders.splice(newIndex, 0, movedFolder);

      return [...parentFolders];
    });
  };

  // 📩 Move an email from one folder to another
  const handleMoveEmail = (emailId, fromFolderId, toFolderId) => {
    if (fromFolderId === toFolderId) return;

    let movedEmail = null;

    const removeEmail = (items) =>
      items.map((folder) =>
        folder.id === fromFolderId
          ? {
              ...folder,
              items: folder.items.filter((email) => {
                if (email.id === emailId) {
                  movedEmail = email;
                  return false;
                }
                return true;
              }),
            }
          : folder
      );

    const addEmail = (items) =>
      items.map((folder) =>
        folder.id === toFolderId ? { ...folder, items: [...folder.items, movedEmail] } : folder
      );

    const updatedFolders = addEmail(removeEmail(folders));
    setFolders(updatedFolders);
  };

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={!isAuthenticated ? <Login setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/home" />}
          />
          <Route
            path="/home"
            element={
              isAuthenticated ? (
                <Home
                  setIsAuthenticated={setIsAuthenticated}
                  folders={folders}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onCreateFolder={handleCreateFolder}
                  onMoveFolder={handleMoveFolder}
                  onReorderFolders={handleReorderFolders}
                  onMoveEmail={handleMoveEmail}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
