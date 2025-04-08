const fetch = require('cross-fetch');

async function testSummarize(emailId) {
  try {
    const response = await fetch(`http://localhost:5001/emails/${emailId}/summarize`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log("Generated Summary:", result.summary);
    } else {
      console.error("Error:", result.error);
    }
  } catch (error) {
    console.error("Test Failed:", error.message);
  }
}

// Test with email ID 3 (using your updated email with body)
testSummarize(1);