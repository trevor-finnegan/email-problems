const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");

// Add a new user
router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("email: " + email);
    console.log("password: " + password);

    if (!password) {
        return res.status(400).json({ error: "Password is required: " + req.body.email});
    }

    // Hash the password before storing it
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO email_app.users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at",
      [email, password_hash]
    );

    res.status(201).json(result.rows[0]); // Return the new user data (without the password hash)
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/isUser", async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await pool.query(
            "SELECT * FROM email_app.users WHERE email = $1",
            [email]
        );

        res.json({ exists: result.rows.length > 0 });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

router.get("/getID", async (req, res) => {
  const { email } = req.query;
    try {
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await pool.query(
            "SELECT id FROM email_app.users WHERE email = $1",
            [email]
        );

        
        res.json({ id: result.rows[0].id });

    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "User with email '" + email + "' not found" });
    }
});


module.exports = router;
