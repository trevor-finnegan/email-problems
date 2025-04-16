import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { gapi } from "gapi-script";
import Home from "./components/Home";
import Login from "./components/Login";
import "./App.css";
import { isUser, addUser, renameFolderDB, deleteFolderDB } from "./api";

const CLIENT_ID =
  "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
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
            discoveryDocs: [
              "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
            ],
            scope: SCOPES,
          })
          .then(() => {
            const authInstance = gapi.auth2.getAuthInstance();
            setIsAuthenticated(authInstance.isSignedIn.get());
            authInstance.isSignedIn.listen(setIsAuthenticated);
            if (authInstance.isSignedIn.get()) {
              const user = authInstance.currentUser.get().getBasicProfile();
  
              const email = user.getEmail();
  
              (async () => {
                const exists = await isUser(email); 
                console.log(exists);
  
                if (!exists) {
                  await addUser(email, "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz");
                  console.log("User added");
                }
              })();
            }
          });
      });
    };

    initClient();
  }, []);

  const handleRenameFolder = async (folderId, newName) => {
    const renameFolder = (items) =>
      items.map((item) => {
        if (item.id.toString() === folderId.toString()) {
          return { ...item, name: newName };
        }
        if (item.type === "folder" && item.items) {
          return { ...item, items: renameFolder(item.items) };
        }
        return item;
      });
    
    setFolders(renameFolder(folders));
    await renameFolderDB(folderId, newName); // Call the API to rename the folder
  };

  const handleDeleteFolder = async (folderId) => {
    const deleteFolder = (items) => {
      // First filter out the folder to be deleted
      const filtered = items.filter(item => item.id.toString() !== folderId.toString());
      
      // Then recursively process remaining folders
      return filtered.map(item => {
        if (item.type === "folder" && item.items) {
          return { ...item, items: deleteFolder(item.items) };
        }
        return item;
      });
    };
    
    setFolders(deleteFolder(folders));
    await deleteFolderDB(folderId); // Call the API to delete the folder
  };

  const handleCreateFolder = (folderName, folderId) => {
    // Remove parentFolderId parameter
    setFolders((prevFolders) => [
      ...prevFolders,
      {
        id: folderId,
        name: folderName,
        type: "folder",
        items: [],
      },
    ]);
  };

  // move a folder to a new parent folder
  const handleMoveFolder = (
    sourceParentId,
    destParentId,
    folderId,
    sourceIndex,
    destIndex
  ) => {
    setFolders((prevFolders) => {
      let movedFolder = null;

      // 1. Remove from source
      const removeFromSource = (items) => {
        // Handle root as source
        if (sourceParentId === "root") {
          const newItems = [...items];
          [movedFolder] = newItems.splice(sourceIndex, 1);
          return newItems;
        }

        return items.map((item) => {
          if (item.id.toString() === sourceParentId) {
            const newItems = [...item.items];
            [movedFolder] = newItems.splice(sourceIndex, 1);
            return { ...item, items: newItems };
          }
          if (item.type === "folder") {
            return { ...item, items: removeFromSource(item.items) };
          }
          return item;
        });
      };

      // 2. Add to destination
      const addToDestination = (items) => {
        // Handle root as destination
        if (destParentId === "root") {
          const newItems = [...items];
          newItems.splice(destIndex, 0, movedFolder);
          return newItems;
        }

        return items.map((item) => {
          if (item.id.toString() === destParentId) {
            const newItems = [...item.items];
            newItems.splice(destIndex, 0, movedFolder);
            return { ...item, items: newItems };
          }
          if (item.type === "folder") {
            return { ...item, items: addToDestination(item.items) };
          }
          return item;
        });
      };

      const afterRemoval = removeFromSource(prevFolders);
      return addToDestination(afterRemoval);
    });
  };

  // reorder folders within the same parent
  const handleReorderFolders = (parentId, startIndex, endIndex) => {
    setFolders((prevFolders) => {
      // Handle root-level reordering
      if (parentId === "root") {
        const newFolders = [...prevFolders];
        const [moved] = newFolders.splice(startIndex, 1);
        newFolders.splice(endIndex, 0, moved);
        return newFolders;
      }

      // Existing nested folder logic
      const reorderItems = (items) => {
        return items.map((item) => {
          if (item.id.toString() === parentId) {
            const newItems = [...item.items];
            const [moved] = newItems.splice(startIndex, 1);
            newItems.splice(endIndex, 0, moved);
            return { ...item, items: newItems };
          }
          if (item.type === "folder") {
            return { ...item, items: reorderItems(item.items) };
          }
          return item;
        });
      };

      return reorderItems(prevFolders);
    });
  };

  // move an email from one folder to another
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
        folder.id === toFolderId
          ? { ...folder, items: [...folder.items, movedEmail] }
          : folder
      );

    const updatedFolders = addEmail(removeEmail(folders));
    setFolders(updatedFolders);
  };

  const updateFolders = (newFolders) => {
    setFolders(newFolders);
  };
  

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              !isAuthenticated ? (
                <Login setIsAuthenticated={setIsAuthenticated} />
              ) : (
                <Navigate to="/home" />
              )
            }
          />
          <Route
            path="/home"
            element={
              isAuthenticated ? (
                <Home
                  setIsAuthenticated={setIsAuthenticated}
                  folders={folders}
                  updateFolders={updateFolders}
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
