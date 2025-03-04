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
<<<<<<< HEAD
  index, // Make sure `index` is passed down from parent component
=======
>>>>>>> 85573e088014bef794398a5be175ac23a772b549
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newFolderName, setNewFolderName] = useState(folder.name);
<<<<<<< HEAD
  const isDraggable = folder.isDraggable ?? true; // Check if folder is draggable

  const handleRename = () => {
    if (newFolderName && newFolderName.trim() !== "") {
      onRenameFolder(folder.id, newFolderName.trim());
      setIsEditing(false);
    }
  };
=======
>>>>>>> 85573e088014bef794398a5be175ac23a772b549

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
<<<<<<< HEAD
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

=======
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


>>>>>>> 85573e088014bef794398a5be175ac23a772b549
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
<<<<<<< HEAD
              index={index} // Pass down index
=======
>>>>>>> 85573e088014bef794398a5be175ac23a772b549
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
<<<<<<< HEAD

      <Draggable draggableId={folder.id.toString()} index={index} isDragDisabled={!isDraggable}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className="draggable-folder"
            style={{ marginLeft: `${level * 15}px`, ...provided.draggableProps.style }}
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
                <span {...provided.dragHandleProps} className="drag-handle">
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

            {isExpanded && (
              <Droppable droppableId={folder.id.toString()} type="email">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="drop-area"
                  >
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
                          index={index}
                        />
                      ) : (
                        <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Email
                                email={item.data}
                                onSelectEmail={onSelectEmail}
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
=======
>>>>>>> 85573e088014bef794398a5be175ac23a772b549
    </div>
  );
};

export default Folder;
