require('dotenv').config(); // Must be first line
const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use("/users", require("./routes/users"));
app.use("/folders", require("./routes/folders"));
app.use("/emails", require("./routes/emails"));

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Add this temporarily in server.js
console.log('Deepseek API Key:', process.env.OPENROUTER_API_KEY ? 'Loaded' : 'Missing');