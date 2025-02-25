import React from 'react';
import Folder from './Folder';

const Sidebar = ({ folders, onSelectEmail, selectedEmail }) => {
  return (
    <div style={{ width: '30%', overflowY: 'auto', borderRight: '1px solid #ccc', padding: '10px' }}>
      <h2>Folders</h2>
      {folders.map(folder => (
        <Folder
          key={folder.id}
          folder={folder}
          onSelectEmail={onSelectEmail}
          selectedEmail={selectedEmail}
        />
      ))}
    </div>
  );
};

export default Sidebar;