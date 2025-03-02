import React, { useState } from "react";
import Email from "./Email";

const Folder = ({
  folder,
  onSelectEmail,
  selectedEmail,
  level = 0,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);

  const handleRename = () => {
    if (newFolderName && newFolderName.trim() !== "") {
      onRenameFolder(folder.id, newFolderName.trim());
      setIsEditing(false);
    }
  };
  
  return (
    <div style={{ marginLeft: `${level * 15}px` }}>
      <div
        style={{
          cursor: "pointer",
          padding: "5px 0",
          height: "40px",
          display: "flex",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        <span onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? "▼" : "▶"}
        </span>
        {isEditing ? (
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={handleRename}
            onKeyUp={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
        ) : (
          <span
            onClick={() => onSelectEmail(null)}
            style={{ marginLeft: "10px", cursor: "pointer" }}
          >
            {folder.name}
          </span>
        )}
        {folder.name !== "Inbox" && (
        <>
        <button onClick={() => setIsEditing(true)} style={{ marginLeft: "10px" }}>
          Rename
        </button>
        <button onClick={() => onDeleteFolder(folder.id)} style={{ marginLeft: "10px" }}>
          Delete
        </button>
        </>
      )}
      </div>


      {isExpanded &&
        folder.items?.map((item, index) =>
          item.type === "folder" ? (
            <Folder
              key={item.id}
              folder={item}
              onSelectEmail={onSelectEmail}
              selectedEmail={selectedEmail}
              level={level + 1}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={onCreateFolder}
            />
          ) : (
            <Email
              key={item.id}
              email={item.data}
              onSelectEmail={onSelectEmail}
              isSelected={selectedEmail?.id === item.data.id}
            />
          )
        )}
    </div>
  );
};

export default Folder;
