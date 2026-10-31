require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Allow the server to read JSON requests
app.use(express.json());

// Serve the frontend files from this project folder
app.use(express.static(__dirname));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});
// Test endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Resume Rater backend is running!"
  });
});
app.get("/api/gemini-test", async (req, res) => {
  try {
    const { GoogleGenAI } = await import("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

   const response = await ai.models.generateContent({
  model: "gemini-3.8-flash",
  contents: "Reply with exactly: Gemini connection successful."
});

    res.json({
      status: "ok",
      message: response.text
    });

  } catch (error) {
    console.error("Gemini test failed:", error);

    res.status(500).json({
      status: "error",
      message: "Gemini request failed. Check the server terminal."
    });
  }
});
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Resume Rater server running at http://localhost:${PORT}`);
  });
}

module.exports = app;

