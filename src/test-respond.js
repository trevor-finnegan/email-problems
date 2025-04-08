const fetch = require('cross-fetch');

async function testRespond(emailId) {
  try {
    const response = await fetch(`http://localhost:5001/emails/${emailId}/respond`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log("Generated Response:", result.response);
    } else {
      console.error("Error:", result.error);
    }
  } catch (error) {
    console.error("Test Failed:", error.message);
  }
}

// Test with email ID 6 (make sure it exists in your database)
testRespond(1);