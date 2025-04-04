const express = require("express");
const router = express.Router();
const pool = require("../db");

// Add a new email
router.post("/", async (req, res) => {
  try {
    const { sender_email, google_message_id, recipient_email, subject, body, folder_id } = req.body;
    console.log(req.body);

    const result = await pool.query(
      "INSERT INTO email_app.emails (sender_email, google_message_id, recipient_email, subject, body, folder_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [sender_email, google_message_id, recipient_email, subject, body, folder_id]
    );

    res.json(result.rows[0]);
    console.log(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/folder/updateFolderId", async (req, res) => {
  try {
    const { email_id, folder_id } = req.body;

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
