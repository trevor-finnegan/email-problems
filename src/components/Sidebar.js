import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Folder from "./Folder";
import {
  addFolder,
  getID,
  getFolderID,
  updateFolderID,
  getEmailId,
} from "../api";
import { gapi } from "gapi-script";

// Add these helper functions at the top of the file
const decodeBase64 = (data) => {
  try {
    return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
  } catch (e) {
    console.error("Error decoding base64:", e);
    return "";
  }
};

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

  const findEmailById = (folders, emailId) => {
    for (const folder of folders) {
      for (const item of folder.items || []) {
        if (item.type === "email" && item.id.toString() === emailId) {
          return item.data; // Found the email
        }
        if (item.type === "folder") {
          const found = findEmailById([item], emailId);
          if (found) return found;
        }
      }
    }
    return null;
  };

  // Drag and drop handling
  const handleDragEnd = async (result) => {
    console.log("Drag result:", {
      source: result.source,
      destination: result.destination,
      type: result.type,
    });
    const { source, destination, draggableId, type } = result;

    if (!destination) return; // Dropped outside the list, do nothing

    const destinationFolder = folders.find(
      (folder) => folder.id.toString() === destination.droppableId
    );

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

      if (destinationFolder.name !== "Inbox") {
        const emailData = findEmailById(folders, draggableId);
        console.log("draggableId:", draggableId); // Log draggableId

        const google_message_id = emailData.id;

        const folder_name = destinationFolder.name; // Get the name of the destination folder

        const user = gapi.auth2
          .getAuthInstance()
          .currentUser.get()
          .getBasicProfile();
        const email = user.getEmail();
        const userID = await getID(email);
        console.log("User ID:", userID); // Log user ID

        const emailID = await getEmailId(google_message_id);

        const folderData = await getFolderID(userID, folder_name);
        const folderID = folderData.folder_id; // Get the ID of the destination folder
        console.log("Folder ID:", folderID); // Log folder ID

        await updateFolderID(folderID, emailID);

        window.location.reload();
      }
    }
  };

  return (
    <div
      style={{
        width: "30%",
        borderRight: "1px solid #ccc",
        padding: "10px",
        height: "100vh",
        overflowY: "auto",
      }}
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
              const user = gapi.auth2
                .getAuthInstance()
                .currentUser.get()
                .getBasicProfile();
              const email = user.getEmail();
              const userID = await getID(email);
              const newFolderData = await addFolder(
                userID,
                newFolderName,
                "custom",
                null
              );
              const newFolderId = newFolderData.id;
              console.log("New folder ID:", newFolderId); // Log the new folder ID
              onCreateFolder(newFolderName, newFolderId);
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
