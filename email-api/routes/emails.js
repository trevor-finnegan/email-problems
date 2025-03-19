const express = require("express");
const router = express.Router();
const pool = require("../db");

// Add a new email
router.post("/", async (req, res) => {
  try {
    const { sender_id, recipient_email, subject, body, folder_id } = req.body;

    const result = await pool.query(
      "INSERT INTO email_app.emails (sender_id, recipient_email, subject, body, folder_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [sender_id, recipient_email, subject, body, folder_id]
    );

    res.json(result.rows[0]);
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
