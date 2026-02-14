const express = require("express");
// const ConnectToMongo = require("./connection");
const cors = require("cors");
require("dotenv").config();

// ConnectToMongo();

const PORT = process.env.PORT || 3005;

const app = express();

app.use(express.json({limit:'50mb'}));
app.use(cors());

// const authRoutes = require("./routes/user");
// const emailRoutes = require("./routes/email");
// const callRoutes = require("./routes/call");
// const faceRoutes = require("./routes/face");
// const botRoutes = require("./routes/bot");
// const superSetRoutes = require('./routes/superset');
// const resumeRoutes = require('./routes/resume');
// const pushRoutes = require('./routes/pushRoutes');
const locationRoutes = require('./routes/location');
// const { createTable } = require("./utils/dbSetup");

// createTable()
//   .then(() => {
//     console.log("Database setup complete.");
//   })
//   .catch((err) => {
//     console.error("Error setting up database:", err);
//   });

// app.use("/api/auth", authRoutes);
// app.use("/api/email", emailRoutes);
// app.use("/api/call", callRoutes);
// app.use("/api/face", faceRoutes);
// app.use("/api/bot", botRoutes);
// app.use("/api/superset", superSetRoutes);
// app.use("/api/resume", resumeRoutes);
// app.use("/api/notifications", pushRoutes);
app.use("/api/location", locationRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/dummy", (req, res) => {
  res.send("Dummy route hit");
});

app
  .listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🔥`);
  })
  .on("error", (err) => {
    console.error("Server error:", err.message);
  });
