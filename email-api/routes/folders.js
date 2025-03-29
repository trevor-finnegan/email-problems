const express = require("express");
const router = express.Router();
const pool = require("../db");

// Add a new folder for a user
router.post("/", async (req, res) => {
  try {
    const { user_id, name, type, parent_folder_id } = req.body;
    console.log(req.body);

    // Ensure type is either 'system' or 'custom'
    if (!["system", "custom"].includes(type)) {
      return res.status(400).json({ error: "Invalid folder type" });
    }

    // Insert the new folder
    const result = await pool.query(
      "INSERT INTO email_app.folders (user_id, name, type, parent_folder_id) VALUES ($1, $2, $3, $4) RETURNING *",
      [user_id, name, type, parent_folder_id]
    );

    res.json(result.rows[0]);
    console.log(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      "SELECT * FROM email_app.folders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
