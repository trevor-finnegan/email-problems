import React, { useState } from 'react';
import Folder from './Folder';

const Sidebar = ({ folders, onSelectEmail, selectedEmail, onRenameFolder, onDeleteFolder, onCreateFolder }) => {
  const [newFolderName, setNewFolderName] = useState("");

  return (
    <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h2>Folders</h2>

      {/* Button and input for creating a new folder */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="New folder name"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          style={{ marginRight: "5px", padding: "5px" }}
          />
          <button 
            onClick={() => {
              if (newFolderName.trim() !== "") {
                onCreateFolder(newFolderName);  
                setNewFolderName("");           
              } else {
                alert("Folder name cannot be empty!");
              }
            }} 
            style={{ padding: "5px 10px" }}
          >
            Create Folder
          </button>
        </div>

      {/* List of folders */}
      {folders.map((folder) => (
        <Folder
          key={folder.id}
          folder={folder}
          onSelectEmail={onSelectEmail}
          selectedEmail={selectedEmail}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onCreateFolder={onCreateFolder}
          disableActions={folder.id === "inbox" || folder.id === "Inbox"}
        />
      ))}
    </div>
  );
};

export default Sidebar;