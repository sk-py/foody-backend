import { pool, pgvector } from "./clients.js"; // Import shared pool and pgvector utilities

async function createTable() {
  const client = await pool.connect(); // Get a client from the pool
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        content TEXT NOT NULL,
        embedding VECTOR(1536), -- 1536 dimensions for text-embedding-3-small
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      -- Create an HNSW index for faster similarity search
      -- Adjust m and ef_construction based on your dataset size and performance needs.
      -- HNSW is generally faster for queries, IVFFlat for faster index builds.
      CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
    `);
    console.log("Documents table and index ensured.");
  } catch (error) {
    console.error("Error creating table:", error);
    throw error; // Re-throw to be caught by the server.js startup
  } finally {
    client.release(); // Release the client back to the pool
  }
}

export { createTable };
