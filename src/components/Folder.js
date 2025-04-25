import React, { useEffect, useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import Email from "./Email";
import { searchEmails } from "../api";
import { gapi } from "gapi-script";

const Folder = ({
  folder,
  onSelectEmail,
  selectedEmail,
  level = 0,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
  onMoveFolder,
  onReorderFolders,
  onMoveEmail,
  index,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);
  const isDraggable = folder.isDraggable ?? true;
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State for tracking search input
  const [visibleItems, setVisibleItems] = useState(folder.items); // State for filtered emails
  const originalFolderItems = folder.items;// Store the original items in the folder
  const [isSearching, setIsSearching] = useState(false); // State for tracking search status

  useEffect(() => {
    if (!isSearching) {
      setVisibleItems(folder.items); // Reset to original items if not searching
    } 
  }, [isSearching, folder.items]);
  

  const handleRename = async () => {
    if (newFolderName && newFolderName.trim() !== "") {
      onRenameFolder(folder.id, newFolderName.trim());
      setIsEditing(false);
    }
  };

  const handleSearchChange = async (event) => {
    const query = event.target.value;
    setSearchQuery(query); // Update the search query
    console.log("Search query:", query); // Log the search query for debugging

    if (query.trim() !== "") {
      setIsSearching(true); 
      const email = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail(); // Get the user's email

      const results = await searchEmails(email, query, folder.id);
  
      const filteredFolderItems = results.map((email) => ({
        id: email.google_message_id,
        type: "email",
        data: {
          id: email.google_message_id,
          payload: {
            headers: [
              { name: "Subject", value: email.subject },
              { name: "From", value: email.sender_email },
              { name: "To", value: email.recipient_email },
              { name: "Message-ID", value: email.google_message_id }
            ],
            body: {
              data: email.body
            }
          }
        }
        }));

      setVisibleItems(filteredFolderItems); 

      console.log("Search results:", results); 
      //setFilteredEmails(results); // Set the filtered emails
    } else {
      setVisibleItems(originalFolderItems); // Reset to original items if search query is empty
      setIsSearching(false); 
    }
  };

  return (
    <Draggable draggableId={folder.id.toString()} index={index} isDragDisabled={!isDraggable}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`folder-level-${level}`}
        >
          <div>
            {isDraggable && (
              <span 
                {...provided.dragHandleProps} 
                className="drag-handle"
              >
                🟰
              </span>
            )}
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
              <span onClick={() => onSelectEmail(null)} style={{ marginLeft: "10px", cursor: "pointer" }}>
                {folder.name}
              </span>
            )}
            {folder.name !== "Inbox" && folder.name !== "Sent" && (
              <>
                <button onClick={() => setIsEditing(true)} style={{ marginLeft: "10px" }}>
                  Rename
                </button>
                <button onClick={() => onDeleteFolder(folder.id)} style={{ marginLeft: "10px" }}>
                  Delete
                </button>
              </>
            )}
            {/* Search Button */}
            <button onClick={() => setIsSearchVisible(!isSearchVisible)} style={{ marginLeft: "10px" }}>
              Search
            </button>
          </div>

          {/* Search Bar */}
          {isSearchVisible && (
            <div style={{ marginTop: "10px" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange} // Handle input changes
                placeholder="Search emails..."
                style={{ padding: "5px", width: "200px" }}
              />
            </div>
          )}

          {isExpanded && (
            <Droppable droppableId={folder.id.toString()} type="email">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="drop-area">
                  {visibleItems?.map((item, index) =>
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
                        onMoveFolder={onMoveFolder}
                        onReorderFolders={onReorderFolders}
                        onMoveEmail={onMoveEmail}
                        index={index}
                      />
                    ) : (
                      <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                        {(provided) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <Email
                              key={item.id}
                              email={item.data}
                              onSelectEmail={(email) => {
                                email.isNew = false;
                                const enhancedEmail = {
                                  ...email,
                                  summary: "This email informs you about scheduled system maintenance, including the date, time, and potential service disruptions.",
                                  actionItems: [
                                    { id: 1, text: "Review Attached Document", completed: false },
                                    { id: 2, text: "Update Project Status", completed: true },
                                    { id: 3, text: "Schedule Follow-Up Meeting", completed: false },
                                  ],
                                };
                                onSelectEmail(enhancedEmail);
                              }}
                              isSelected={selectedEmail?.id === item.data.id}
                            />
                          </div>
                        )}
                      </Draggable>
                    )
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default Folder;
