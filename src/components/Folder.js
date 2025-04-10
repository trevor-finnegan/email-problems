import React, { useState } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import Email from "./Email";

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

  const handleRename = () => {
    if (newFolderName && newFolderName.trim() !== "") {
      onRenameFolder(folder.id, newFolderName.trim());
      setIsEditing(false);
    }
  };

  return (
    <Draggable draggableId={folder.id.toString()} index={index} isDragDisabled={!isDraggable}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            marginLeft: `${level * 15}px`,
            ...provided.draggableProps.style,
          }}
        >
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
            {isDraggable && (
              <span 
                {...provided.dragHandleProps} 
                className="drag-handle"
                style ={{ fontsize: "12px", marginRight: "1px", opacity: 1.0}}
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

          {isExpanded && (
            <Droppable droppableId={folder.id.toString()} type="email">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="drop-area">
                  {folder.items?.map((item, index) =>
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
