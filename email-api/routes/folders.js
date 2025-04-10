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

router.get("/getFolderID", async (req, res) => {
  try {
    const { user_id, folder_name } = req.query;

    if (!user_id || !folder_name) {
      return res.status(400).json({ error: "Missing user_id or folder_name" });
    }

    const result = await pool.query(
      "SELECT id FROM email_app.folders WHERE user_id = $1 AND name = $2",
      [user_id, folder_name]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json({ folder_id: result.rows[0].id });
    console.log("Folder ID: " + result.rows[0].id);
  } catch (err) {
    console.error("Error fetching folder ID:", err);
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

router.put("/rename", async (req, res) => {
  try {
    const { folderId, newName } = req.query;

    const result = await pool.query(
      "UPDATE email_app.folders SET name = $1 WHERE id = $2 RETURNING *",
      [newName, folderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Folder not found" });
    }

    res.json(result.rows[0]);
    console.log("Folder renamed:", result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;

    // Delete the folder and all its subfolders
    await pool.query(
      "DELETE FROM email_app.folders WHERE id = $1 OR parent_folder_id = $1",
      [folderId]
    );

    res.status(204).send(); // No content to send back
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;

