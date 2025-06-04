const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { openai, pool, pgvector } = require("../utils/clients.js");

/**
 * Generates vector embeddings for a given text using OpenAI's API.
 * @param {string} text - The text to embed.
 * @returns {Promise<number[]>} - A promise that resolves to the embedding vector.
 */

async function generateEmbeddings(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    // Ensure we're accessing the correct embedding data structure
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    // Implement robust retry logic with exponential backoff for production
    throw error;
  }
}

/**
 * Chunks a document, generates embeddings for each chunk, and stores them in the database.
 * @param {string} documentText - The full text content of the document.
 */

async function ingestDocument(documentText) {
  // 1. Chunk the document using LangChain's RecursiveCharacterTextSplitter
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500, // Recommended chunk size for RAG context
    chunkOverlap: 100, // Overlap for context continuity between chunks
    separators: ["\n\n", "\n", " ", ""], // Prioritize splitting by paragraphs, then lines, then spaces
  });
  const chunks = await splitter.splitText(documentText);
  // console.log(`Split document into ${chunks.length} chunks.`, chunks);

  const client = await pool.connect(); // Get a client from the pool for transaction
  try {
    await client.query("BEGIN"); // Start a transaction for atomicity

    // 2. Generate embeddings for each chunk and store in DB
    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbeddings(chunk);
        // Use pgvector.toSql() to correctly format the embedding array for PostgreSQL
        await client.query(
          "INSERT INTO documents (content, embedding) VALUES ($1, $2)",
          [chunk, pgvector.toSql(embedding)]
        );
        console.log(`Inserted chunk into DB: ${chunk.substring(0, 50)}...`);
      } catch (chunkError) {
        console.error(
          `Failed to process chunk: ${chunk.substring(0, 50)}...`,
          chunkError
        );
        // Decide whether to continue or break on chunk error.
        // For critical ingestion, you might want to rollback and re-attempt the whole document.
        // For robustness, you might log and continue, allowing partial ingestion.
        // For this example, we'll just log and continue.
      }
    }
    await client.query("COMMIT"); // Commit the transaction
   
    
    console.log("Document ingestion complete.");
  } catch (mainError) {
    await client.query("ROLLBACK"); // Rollback on any major error
    console.error("Error during document ingestion transaction:", mainError);
    throw mainError;
  } finally {
    client.release(); // Release the client back to the pool
  }
}

module.exports =  { generateEmbeddings, ingestDocument };
