import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { gapi } from 'gapi-script';
import Home from './components/Home';
import Login from './components/Login';
import './App.css';

const CLIENT_ID = "100724291989-599ausdmuaaub1rghcf467dg1ekhv3v7.apps.googleusercontent.com";
const API_KEY = "AIzaSyDK9rjobYN4JgJkfwwfALtBmqD-fEAIX-А";
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [folders, setFolders] = useState([
    {
      id: 'root',
      name: 'Inbox',
      type: 'folder',
      items: [],
    },
  ]);

  useEffect(() => {
    const initClient = () => {
      gapi.load('client:auth2', () => {
        gapi.client
          .init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
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

  // Handler for renaming a folder
  const handleRenameFolder = (folderId, newName) => {
    const renameFolder = (items) =>
      items.map((item) =>
        item.id === folderId
          ? { ...item, name: newName }
          : item.type === 'folder'
          ? { ...item, items: renameFolder(item.items) }
          : item
      );
    setFolders(renameFolder(folders));
  };

  // Handler for deleting a folder
  const handleDeleteFolder = (folderId) => {
    const deleteFolder = (items) =>
      items.filter((item) =>
        item.id === folderId ? false : item.type === 'folder' ? { ...item, items: deleteFolder(item.items) } : true
      );
    setFolders(deleteFolder(folders));
  };

  // Handler for creating a new folder
  const handleCreateFolder = (parentFolderId, folderName) => {
    setFolders((prevFolders) => {
      const newFolder = {
        id: Date.now().toString(), // Unique ID for the new folder
        name: folderName,
        type: 'folder',
        items: [],
      };
  
      if (parentFolderId === 'root') {
        // Directly modify state using a new array
        return [...prevFolders, newFolder];
      }
  
      // Function to recursively find and update the correct folder
      const addFolder = (items) => {
        return items.map((item) => {
          if (item.id === parentFolderId) {
            return { ...item, items: [...item.items, newFolder] };
          }
          if (item.type === 'folder') {
            return { ...item, items: addFolder(item.items) };
          }
          return item;
        });
      };
  
      // Ensure a new reference is returned to trigger re-render
      return JSON.parse(JSON.stringify(addFolder(prevFolders)));
    });
  };  
  
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
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
              />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </GoogleOAuthProvider>
  );
};

const AppWrapper = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;
