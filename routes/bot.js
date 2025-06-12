const express = require("express");
const {
  generateEmbeddings,
  ingestDocument,
} = require("../services/embeddingService");
const { handleIngestData, handleChatQuery } = require("../controllers/bot");

const router = express.Router();

router.post("/generate-embedding", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text is required" });
  }

  try {
    const embedding = await generateEmbeddings(text);
    return res.status(200).json({ embedding });
  } catch (error) {
    console.error("Error generating embedding:", error);
    return res.status(500).json({ error: "Failed to generate embedding" });
  }
});

router.post("/ingest-document", handleIngestData);

router.post("/user-chat", handleChatQuery);

router.post("/client-key", (req, res) => {
  const { key } = req.body;

  if (!key) {
    return res.status(400).json({ error: "Query text is required." });
  }

  try {
    console.log("Received client key:", key);
    // Here you can handle the client key as needed, e.g., store it or validate it

    res.status(200).json({ response: "ok" });
  } catch (error) {
    console.error("Error during chat query API call:", error);
    res
      .status(500)
      .json({ error: "Failed to get a response from the chatbot." });
  }
});

module.exports = router;
