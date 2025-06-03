const {
  retrieveRelevantDocs,
  generateChatResponse,
} = require("../services/chatService.js");
const {
  ingestDocument,
  generateEmbeddings,
} = require("../services/embeddingService");

/**
 * Express controller function to handle document ingestion requests.
 * Expects { text: string, sourceUrl?: string } in the request body.
 */

async function handleIngestData(req, res) {
  const { text, sourceUrl } = req.body;

  if (!text) {
    return res
      .status(400)
      .json({ error: "Text content is required for ingestion." });
  }

  try {
    await ingestDocument(text, sourceUrl);
    res.status(200).json({ message: "Document ingested successfully." });
  } catch (error) {
    console.error("Error during document ingestion API call:", error);
    res
      .status(500)
      .json({ error: "Failed to ingest document. Please check server logs." });
  }
}

/**
 * Express controller function to handle user chat queries.
 * Expects { query: string } in the request body.
 */
async function handleChatQuery(req, res) {
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Transfer-Encoding", "chunked");


  const { query } = req.body;

  if (!query) {
    res.write(JSON.stringify({ type: 'error', data: 'Query is required' }) + '\n');
    res.end();
    return;
  }

  try {
    // 1. Generate embedding for the user's query
    const queryEmbedding = await generateEmbeddings(query);

    // 2. Retrieve relevant context from pgvector
    const relevantDocs = await retrieveRelevantDocs(queryEmbedding, 5); // Retrieve top 5 docs

    // 3. Generate response using the LLM, augmented with context and stream it back to client
    await generateChatResponse(query, relevantDocs, res);

  } catch (error) {
    console.error("Error during chat query API call:", error);
    res.write(JSON.stringify({ type: 'error', data: 'Failed to process query' }) + '\n');
    res.end();
  }
}

module.exports = { handleIngestData, handleChatQuery };
