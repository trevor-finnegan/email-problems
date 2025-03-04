import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd"; // Import DnD components
import Folder from "./Folder";

const Sidebar = ({
  folders,
  onSelectEmail,
  selectedEmail,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onMoveFolder,
  onReorderFolders,
  onMoveEmail,
}) => {
  const [newFolderName, setNewFolderName] = useState("");

  const handleDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    // If dropped outside the list, do nothing
    if (!destination) return;

    // Handle folder movement
    if (type === "folder") {
      if (source.droppableId === destination.droppableId) {
        onReorderFolders(draggableId, destination.index); // Reorder within the same folder
      } else {
        onMoveFolder(draggableId, destination.droppableId); // Move to a new parent folder
      }
    }

    // Handle email movement
    if (type === "email") {
      onMoveEmail(draggableId, source.droppableId, destination.droppableId);
    }
  };

  return (
    <div style={{ width: "30%", borderRight: "1px solid #ccc", padding: "10px" }}>
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
              setNewFolderName(""); // Reset after creation
            } else {
              alert("Folder name cannot be empty!");
            }
          }}
          style={{ padding: "5px 10px" }}
        >
          Create Folder
        </button>
      </div>

      {/* Drag-and-drop context for folders */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="root" type="folder">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {folders.map((folder, index) => (
                <Folder
                  key={folder.id}
                  folder={folder}
                  onSelectEmail={onSelectEmail}
                  selectedEmail={selectedEmail}
                  onRenameFolder={onRenameFolder}
                  onDeleteFolder={onDeleteFolder}
                  onCreateFolder={onCreateFolder}
                  index={index} // Pass index for drag-and-drop
                  disableActions={folder.id === "inbox" || folder.id === "Inbox"}
                />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Sidebar;
