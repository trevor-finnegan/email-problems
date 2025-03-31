const API_URL = "http://localhost:5000";

// Add a user
export const addUser = async (email, password) => {
    const response = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email , password }),
    });
    return response.json();
  };

// Add a folder
export const addFolder = async (user_id, name, type, parentFolderId) => {
    const response = await fetch(`${API_URL}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, name, type, parent_folder_id: parentFolderId }),
    });
    return response.json();
  };

// Fetch user's folders
export const getFolders = async (userId) => {
  const response = await fetch(`${API_URL}/folders/${userId}`);
  return response.json();
};

// Add an email
export const addEmail = async (emailData) => {
  const response = await fetch(`${API_URL}/emails`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailData),
  });
  return response.json();
};

// Fetch emails in a folder
export const getEmails = async (folderId) => {
  const response = await fetch(`${API_URL}/emails/folder/${folderId}`);
  return response.json();
};

// Check if a user exists in the database
export const isUser = async (email) => {
    try {
      const response = await fetch(`${API_URL}/users/isUser?email=${(email)}`);
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
  
      const data = await response.json();
      return data.exists; // Correctly await and return exists value
    } catch (error) {
      console.error("Error checking user existence:", error);
      return false; // Assume user doesn't exist if there's an error
    }
  };

// Get user ID
export const getID = async (email) => {
  try {

    const response = await fetch(`${API_URL}/users/getID?email=${(email)}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data.id; // Correctly await and return exists value
  } catch (error) {
    console.error("Error checking user id:", error);
    return -1; // Assume user doesn't exist if there's an error
  }
};

export const updateFolderID = async (folderId, emailId) => {
  const response = await fetch(`${API_URL}/emails/folder/updateFolderID`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId, email_id: emailId }),
  });
  return response.json();
};

export const getFolderID = async (userId, folderName) => {
  const response = await fetch(`${API_URL}/folders/getFolderID?user_id=${userId}&folder_name=${folderName}`);
  return response.json();
};
  
