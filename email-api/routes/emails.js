require('dotenv').config();
const express = require("express");
const router = express.Router();
const pool = require("../db");
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');

//Extract readable text from HTML body of the email
function extractReadableText(htmlBody) {
  const dom = new JSDOM(htmlBody);
  const document = dom.window.document;

  document.querySelectorAll("script, style, noscript").forEach(el => el.remove());

  return document.body.textContent.trim();
}

// Add a new email
router.post("/", async (req, res) => {
  try {
    const { sender_email, google_message_id, recipient_email, subject, body, folder_id } = req.body;

    const bodyText = extractReadableText(body);

    const query = `
    INSERT INTO email_app.emails (
      sender_email,
      recipient_email,
      subject,
      body,
      google_message_id,
      folder_id,
      search_vector
    ) VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $7 || ' ' || $8 || ' ' || $9))
    RETURNING *
    `;

    const result = await pool.query(query, [
      sender_email,      // $1
      recipient_email,   // $2
      subject,           // $3
      body,              // $4
      google_message_id, // $5
      folder_id,         // $6
      sender_email,      // $7
      subject,           // $8
      bodyText           // $9
    ]);

    res.json(result.rows[0]);
    //console.log("Search Vector:", result.rows[0].search_vector);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Search emails using a search vector
router.get("/search", async (req, res) => {
  try {
    let { email, folder_id, query } = req.query;
    console.log("email: ", email);

    if (!query || query.trim() === '') {
      return res.status(400).json({ error: "Missing search query" });
    }

    let result = null;

    if (folder_id === "inbox") {
      result = await pool.query(
        `SELECT * FROM email_app.emails
        WHERE search_vector @@ plainto_tsquery('english', $1)
        AND recipient_email = $2`,
        [query, email]
      );
    }
    else {
      result = await pool.query(
        `SELECT * FROM email_app.emails
        WHERE search_vector @@ plainto_tsquery('english', $1)
        AND recipient_email = $2 AND folder_id = $3`,
        [query, email, folder_id]
      );
   }

    res.json(result.rows);
    console.log("# search results:", result.rows.length); 
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error during search" });
  }
});


router.get("/emailExists", async (req, res) => {
  try {
    const { google_message_id } = req.query;

    const result = await pool.query(
      "SELECT * FROM email_app.emails WHERE google_message_id = $1",
      [google_message_id]
    );

    res.json({ exists: result.rows.length > 0 });
    //console.log(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/getEmailId", async (req, res) => {
  try {
    const { google_message_id } = req.query;

    const result = await pool.query(
      "SELECT id FROM email_app.emails WHERE google_message_id = $1",
      [google_message_id]
    );

    res.json({ id: result.rows[0]?.id || null });
    //console.log(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/folder/updateFolderId", async (req, res) => {
  try {
    const { email_id, folder_id } = req.body;
    console.log("Update folder request:", req.body);

    const result = await pool.query(
      "UPDATE email_app.emails SET folder_id = $1 WHERE id = $2 RETURNING *",
      [folder_id, email_id]
    );

    res.json(result.rows[0]);
    console.log("email with id: " + email_id + " moved to folder with id: " + folder_id);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get emails in a specific folder
router.get("/folder/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;

    const result = await pool.query(
      "SELECT * FROM email_app.emails WHERE folder_id = $1 ORDER BY sent_at DESC",
      [folderId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;



router.post('/:id/summarize', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get email content
    const emailRes = await pool.query(
      'SELECT body FROM email_app.emails WHERE id = $1',
      [id]
    );

    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { body } = emailRes.rows[0];
    
    console.log('Using API Key:', process.env.OPENROUTER_API_KEY ? 'Exists' : 'Missing');

    const prompt = "Summarize this email descriptively. Make sure all points in the email are represented, so the user does not miss information. Here is the email:"
    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "Email Client"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [
          {
            "role": "user",
            "content": `${prompt}\n\n${body}`
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('OpenRouter Response:', result);
      throw new Error(`OpenRouter error: ${result.error?.message}`);
    }

    // Return summary without storing it
    res.json({
      success: true,
      summary: result.choices[0].message.content
    });

  } catch (err) {
    console.error('Summarization error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Summarization failed'
    });
  }
});


router.post('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get email content
    const emailRes = await pool.query(
      'SELECT body FROM email_app.emails WHERE id = $1',
      [id]
    );

    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { body } = emailRes.rows[0];
    
    const responsePrompt = `Generate an appropriate response to this email. Follow these guidelines: Address any questions asked in the email. Keep the response professional and concise. Maintain the original email's context. Use proper email formatting. Here is the email: ${body}`;

    // Call OpenRouter API
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "Email Client"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3-0324:free",
        "messages": [
          {
            "role": "user",
            "content": responsePrompt
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('OpenRouter Response:', result);
      throw new Error(`OpenRouter error: ${result.error?.message}`);
    }

    // Return response draft
    res.json({
      success: true,
      response: result.choices[0].message.content
    });

  } catch (err) {
    console.error('Response generation error:', err);
    res.status(500).json({ 
      success: false,
      error: 'Response generation failed',
      details: err.message
    });
  }
});

router.get('/userEmails', async (req, res) => {
  try {
    const { email } = req.query;

    const result = await pool.query(
      "SELECT * FROM email_app.emails WHERE recipient_email = $1",
      [email]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});