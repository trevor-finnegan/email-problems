import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Folder from "./Folder";
import { addFolder, getID } from "../api";
import { gapi } from "gapi-script";

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
    console.log("Drag result:", {
      source: result.source,
      destination: result.destination,
      type: result.type,
    });
    const { source, destination, draggableId, type } = result;

    if (!destination) return; // Dropped outside the list, do nothing

    if (type === "folder") {
      if (source.droppableId === destination.droppableId) {
        // Reorder within the same folder
        onReorderFolders(
          source.droppableId, // Parent folder ID
          source.index, // Original index
          destination.index //new index
        );
      } else {
        // Move folder to a new parent folder
        onMoveFolder(
          source.droppableId, //source parent ID
          destination.droppableId, // dest parent ID
          draggableId, // folder ID
          source.index, //original index
          destination.index //new index
        );
      }
    }

    if (type === "email") {
      onMoveEmail(draggableId, source.droppableId, destination.droppableId);
    }
  };

  return (
    <div
      style={{ width: "30%", borderRight: "1px solid #ccc", padding: "10px" }}
    >
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
          onClick={async () => {
            if (newFolderName.trim() !== "") {
              onCreateFolder(newFolderName); // Create under inbox by default
              setNewFolderName("");
              const user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
              const email = user.getEmail();
              const userID = await getID(email);
              await addFolder(userID, newFolderName, "custom", null);

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
