const OpenAI = require("openai");
const pkg = require("pg"); // Use pkg for destructuring Pool
const pgvector = require("pgvector/pg");
const dotenv = require("dotenv");

dotenv.config();

const { Pool } = pkg;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize PostgreSQL connection pool
// const pool = new Pool({
//   connectionString: process.env.POSTGRES_URL,
//   user: process.env.POSTGRES_USER,
//   password: process.env.POSTGRES_PASSWORD,
// });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: "20.244.24.92",
  port: 5432,
  database: "bot",
});

// Register pgvector types for the pool to handle vector data correctly
pool.on("connect", async (client) => {
  await pgvector.registerTypes(client);
});

module.exports = { openai, pool, pgvector };
