import React, { useState } from "react";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import Folder from "./Folder";
import { addFolder, getID, getFolderID, addEmail } from "../api";
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

    const destinationFolder = folders.find(folder => folder.id.toString() === destination.droppableId);

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
      
      if(destinationFolder.name !== "Inbox"){
        
        const emailData = findEmailById(folders, draggableId);

        const sender_email = emailData.payload.headers.find(
          (header) => header.name === "From"
        ).value.split('<')[1].split('>')[0]; // Extract sender email from "From" header

        console.log("Sender email:", sender_email); // Log sender email

        const recipient_email = emailData.payload.headers.find(
          (header) => header.name === "Delivered-To"
        ).value; // Extract recipient email from "To" header
        console.log("Recipient email:", recipient_email); // Log recipient email

        const google_message_id = emailData.payload.headers.find(
          (header) => header.name === "Message-ID"
        ).value.split('<')[1].split('>')[0]; // Extract Google message ID from "Message-ID" header
        console.log("Google message ID:", google_message_id); // Log Google message ID

        const subject = emailData.payload.headers.find(
          (header) => header.name === "Subject"
        ).value; // Extract subject from "Subject" header
        console.log("Subject:", subject); // Log subject

        const body = null; // Placeholder for email body

        const folder_name = destinationFolder.name; // Get the name of the destination folder
        console.log("Folder name:", folder_name); // Log folder name

        const user = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        const email = user.getEmail();
        const userID = await getID(email);
        console.log("User ID:", userID); // Log user ID

        const folderData = await getFolderID(userID, folder_name);
        const folderID = folderData.folder_id; // Get the ID of the destination folder
        console.log("Folder ID:", folderID); // Log folder ID

        const emailDataToSend = {
          sender_email,
          google_message_id,
          recipient_email,
          subject,
          body,
          folder_id: folderID,
        };

        await addEmail(emailDataToSend); // Send email data to the server

      } 

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
