const API_URL = "http://localhost:5001";

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
  const response = await fetch(`${API_URL}/emails/folder/updateFolderId`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder_id: folderId, email_id: emailId }),
  });
  return response.json();
};

export const getFolderID = async (userId, folderName) => {
  const response = await fetch(`${API_URL}/folders/getFolderID?user_id=${userId}&folder_name=${folderName}`);
  return response.json();
};

export const emailExists = async (googleMessageId) => {
  const response = await fetch(`${API_URL}/emails/emailExists?google_message_id=${googleMessageId}`);
  return response.json();
};
  
export const summarizeEmail = async (emailId) => {
  try {
    const response = await fetch(`${API_URL}/emails/${emailId}/summarize`, {
      method: 'POST'
    });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Summarization failed');
    }
    
    return data;
  } catch (error) {
    console.error('Summarization error:', error);
    return { 
      success: false,
      error: error.message 
    };
  }
};

export const userEmails = async (email) => {
  try {
    const response = await fetch(`${API_URL}/emails/userEmails?email=${(email)}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; // Correctly await and return exists value
  } catch (error) {
    console.error("Error checking user emails:", error);
    return []; // Assume user doesn't exist if there's an error
  }
};

export const getEmailId = async (googleMessageId) => {
  try {
    const response = await fetch(`${API_URL}/emails/getEmailId?google_message_id=${(googleMessageId)}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Data from getEmailId:", data); // Log the data for debugging
    return data.id; // Correctly await and return exists value
  } catch (error) {
    console.error("Error checking user emails:", error);
    return -1; // Assume user doesn't exist if there's an error
  }
};

export const searchEmails = async (email, query, folderId) => {
  try {
    const response = await fetch(`${API_URL}/emails/search?email=${email}&folder_id=${folderId}&query=${query}`);
    
    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    return data; // Correctly await and return exists value
  } catch (error) {
    console.error("Error checking user emails:", error);
    return []; // Assume user doesn't exist if there's an error
  }
};

export const renameFolderDB = async (folderId, newName) => {
  const response = await fetch(`${API_URL}/folders/rename?folderId=${folderId}&newName=${newName}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
  });
  return response.json();
};

export const deleteFolderDB = async (folderId) => {
  const response = await fetch(`${API_URL}/folders/${folderId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (response.status === 204) {
    return { success: true }; // Return a success object
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete folder");
  }
  return data;
};