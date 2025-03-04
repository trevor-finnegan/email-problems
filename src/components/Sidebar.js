import React, { useState } from 'react';
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Folder from './Folder';

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

  // Drag and drop handling
  const handleDragEnd = (result) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) return; // Dropped outside the list, do nothing

    if (type === "folder") {
      if (source.droppableId === destination.droppableId) {
        // Reorder within the same folder
        onReorderFolders(draggableId, destination.index);
      } else {
        // Move folder to a new parent folder
        onMoveFolder(draggableId, destination.droppableId);
      }
    }

    if (type === "email") {
      onMoveEmail(draggableId, source.droppableId, destination.droppableId);
    }
  };

  return (
    <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h2>Folders</h2>

      {/* Folder creation */}
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
              onCreateFolder(newFolderName); // Create under inbox by default
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
                  onMoveFolder={onMoveFolder}
                  onReorderFolders={onReorderFolders}
                  onMoveEmail={onMoveEmail}
                  index={index}
                  disableActions={folder.id === "inbox"}
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
