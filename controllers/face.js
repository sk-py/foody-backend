// const axios = require("axios");
// const FormData = require("form-data");
// const fs = require("fs");
// const { Pool } = require('pg');
// require("dotenv").config();

// // Create a connection pool
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// const getFaceEmbedding = async (imagePath) => {
//   const form = new FormData();
//   form.append("file", fs.createReadStream(imagePath));

//   try {
//     const response = await axios.post("http://localhost:8000/embed", form, {
//       headers: form.getHeaders(),
//     });
//     return response.data.embedding;
//   } catch (error) {
//     console.error("Embedding error:", error.message);
//     throw error;
//   }
// };

// const handleFaceRegister = async (req, res) => {
//   const imagePath = req.file.path;
//   try {
//     const embedding = await getFaceEmbedding(imagePath);
//     fs.unlinkSync(imagePath); // Delete file after processing
//     res.json({ success: true, embedding });
//   } catch (error) {
//     if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); // Cleanup on error
//     res
//       .status(500)
//       .json({ success: false, message: "Embedding extraction failed" });
//   }
// };

// const handleFaceLogin = async (req, res) => {
//   const imagePath = req.file.path;
//   try {
//     const embedding = await getFaceEmbedding(imagePath);

//     // Query pgvector for nearest neighbor
//     res.json({ success: true, user: { id: "123", name: "John Doe" } });
//   } catch (error) {
//     res.status(500).json({ success: false, message: "No match found" });
//   }
// };

// module.exports = {
//   handleFaceRegister,
//   handleFaceLogin,
// };

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
require("dotenv").config();
const { Pool } = require("pg");

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const getFaceEmbedding = async (imagePath) => {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  try {
    const response = await axios.post("http://localhost:8000/embed", form, {
      headers: form.getHeaders(),
    });
    return response.data.embedding; // Returns a JavaScript array
  } catch (error) {
    console.error("Embedding error:", error.message);
    throw error;
  }
};

const handleFaceRegister = async (req, res) => {
  const imagePath = req.file.path;
  try {
    const embedding = await getFaceEmbedding(imagePath);
    if (!Array.isArray(embedding)) {
      throw new Error("Embedding is not an array");
    }
    // Manual formatting as PostgreSQL array with vector cast
    const vectorEmbedding = `[${embedding.join(",")}]`; // e.g., {1.1668387651443481, 0.467239111661911, ...}
    await pool.query(
      "INSERT INTO users (user_id, name, embedding) VALUES ($1, $2, $3::vector) ON CONFLICT (user_id) DO NOTHING",
      [
        req.body.user_id || "default_user",
        req.body.name || "Unknown",
        vectorEmbedding,
      ]
    );
    fs.unlinkSync(imagePath);
    res.json({ success: true, embedding });
  } catch (error) {
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res
      .status(500)
      .json({
        success: false,
        message: "Registration failed: " + error.message,
      });
  }
};

const handleFaceLogin = async (req, res) => {
  const imagePath = req.file.path;
  try {
    const embedding = await getFaceEmbedding(imagePath);

    const vectorEmbedding = `[${embedding.join(",")}]`;
 
    const result = await pool.query(
      "SELECT user_id, name, embedding <-> $1 AS distance FROM users ORDER BY distance LIMIT 1",
      [vectorEmbedding]
  );
  fs.unlinkSync(imagePath);
  if (result.rows.length > 0) {
      const distance = result.rows[0].distance;
      console.log("Distance:", distance); // Debug log
      if (distance < 8) { 
          res.json({ success: true, user: result.rows[0] });
      } else {
          res.status(500).json({ success: false, message: "No match found" });
      }
  } else {
      res.status(500).json({ success: false, message: "No match found" });
  }
} catch (error) {
  if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
  res.status(500).json({ success: false, message: "Login failed: " + error.message });
}
};

module.exports = { handleFaceRegister, handleFaceLogin };
