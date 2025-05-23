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

  const rawText = document.body.textContent || '';
  const cleanedText = rawText.replace(/\s+/g, ' ').trim(); // Normalize whitespace

  return cleanedText;
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

router.post('/:id/summarize', async (req, res) => {
  try {
    const { id } = req.params;

    const emailRes = await pool.query(
      'SELECT body FROM email_app.emails WHERE id = $1',
      [id]
    );

    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { body } = emailRes.rows[0];

    const prompt = "Summarize this email in 1–2 sentences. Focus only on the main message, skip greetings, closings, and unnecessary details. Be clear and concise. Here's the email:";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "Email Client"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: `${prompt}\n\n${body}` }]
      })
    });

    const result = await response.json();
    console.log("Summarization raw result:", JSON.stringify(result, null, 2));

    if (!response.ok || !result.choices?.[0]?.message?.content) {
      throw new Error(result.error?.message || "No summary returned.");
    }

    res.json({
      success: true,
      summary: result.choices[0].message.content
    });

  } catch (err) {
    console.error('Summarization error:', err);
    res.status(500).json({ success: false, error: 'Summarization failed', details: err.message });
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

router.post('/:id/action-items', async (req, res) => {
  try {
    const { id } = req.params;

    const emailRes = await pool.query(
      'SELECT body FROM email_app.emails WHERE id = $1',
      [id]
    );

    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { body } = emailRes.rows[0];

    const prompt = `Extract up to 3 of the most important actionable tasks based on the email below. Each item should begin with a verb (e.g., "Read", "Register", "Review") and omit any introductory phrases like "Here are...". Return each task as a bullet point.\n\nEmail:\n${body}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "Email Client"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const result = await response.json();
    console.log("Action Items raw result:", JSON.stringify(result, null, 2));

    if (!response.ok || !result.choices?.[0]?.message?.content) {
      throw new Error(result.error?.message || "No action items returned.");
    }

    const rawText = result.choices[0].message.content;

    const items = rawText
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 4)
      .map((line, index) => ({
        id: index + 1,
        text: line.replace(/^[-•\d.]+/, '').trim(),
        completed: false
      }));

    res.json({ success: true, actionItems: items });

  } catch (err) {
    console.error('Action item generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Action item generation failed',
      details: err.message
    });
  }
});
router.post('/:id/respond', async (req, res) => {
  try {
    const { id } = req.params;

    const emailRes = await pool.query(
      'SELECT body FROM email_app.emails WHERE id = $1',
      [id]
    );

    if (emailRes.rows.length === 0) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const { body } = emailRes.rows[0];

    const prompt = `Generate an appropriate response to this email. Keep it professional and concise. Here's the email:\n\n${body}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:5001",
        "X-Title": "Email Client"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const result = await response.json();
    console.log("Response Draft raw result:", JSON.stringify(result, null, 2));

    if (!response.ok || !result.choices?.[0]?.message?.content) {
      throw new Error(result.error?.message || "No draft returned.");
    }

    res.json({ success: true, response: result.choices[0].message.content });

  } catch (err) {
    console.error('Response generation error:', err);
    res.status(500).json({
      success: false,
      error: 'Response generation failed',
      details: err.message
    });
  }
});
router.post("/send", async (req, res) => {
  try {
    const { to, subject, body, accessToken } = req.body;

    if (!to || !subject || !body || !accessToken) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Construct the email in RFC 5322 format
    const emailLines = [`To: ${to}`, `Subject: ${subject}`, "", body];
    const emailContent = emailLines.join("\r\n");

    const encodedEmail = Buffer.from(emailContent)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email via Gmail API
    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    const gmailData = await gmailResponse.json();

    if (!gmailResponse.ok) {
      console.error("Gmail API error:", gmailData);
      return res.status(500).json({ success: false, error: "Failed to send email" });
    }

    // Get sender email using accessToken
    const profileResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const profileData = await profileResponse.json();
    const sender_email = profileData.emailAddress;

    // Get user ID from database
    const userResult = await pool.query("SELECT id FROM email_app.users WHERE email = $1", [sender_email]);
    const user_id = userResult.rows[0]?.id;
    if (!user_id) {
      return res.status(400).json({ error: "User not found in database" });
    }

    // Get Sent folder ID for user
    const folderResult = await pool.query(
      "SELECT id FROM email_app.folders WHERE user_id = $1 AND name = 'Sent'",
      [user_id]
    );
    const folder_id = folderResult.rows[0]?.id;
    if (!folder_id) {
      return res.status(400).json({ error: "Sent folder not found for user" });
    }

    // Insert sent email into database
    await pool.query(
      `INSERT INTO email_app.emails (
        sender_email, recipient_email, subject, body, google_message_id, folder_id, search_vector
      ) VALUES ($1, $2, $3, $4, $5, $6, to_tsvector('english', $7 || ' ' || $8 || ' ' || $9))`,
      [
        sender_email,
        to,
        subject,
        body,
        gmailData.id,
        folder_id,
        sender_email,
        subject,
        extractReadableText(body),
      ]
    );

    res.json({ success: true, message: "Email sent and saved to Sent folder.", data: gmailData });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ success: false, error: "Server error sending email" });
  }
});

module.exports = router;
