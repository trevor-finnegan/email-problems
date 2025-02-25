import React, { useState } from "react";
import Email from "./Email";

const Folder = ({ folder, onSelectEmail, selectedEmail, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
   <div style={{ marginLeft: `${level * 15}px` }}>
     <div 
       onClick={() => setIsExpanded(!isExpanded)}
       style={{ 
         cursor: 'pointer',
         padding: '5px 0',
         height: '40px', // Half of email height (80px/2)
         display: 'flex',
         alignItems: 'center',
         boxSizing: 'border-box'
       }}
     >
       {isExpanded ? '▼' : '▶'} {folder.name}
     </div>
     {isExpanded && folder.items?.map((item, index) => (
       item.type === 'folder' ? (
         <Folder
           key={item.id}
           folder={item}
           onSelectEmail={onSelectEmail}
           selectedEmail={selectedEmail}
           level={level + 1}
         />
       ) : (
         <Email
           key={item.id}
           email={item.data}
           onSelectEmail={onSelectEmail}
           isSelected={selectedEmail?.id === item.data.id}
         />
       )
     ))}
   </div>
 );
};

export default Folder;
