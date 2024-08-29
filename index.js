const express = require("express")
const ConnectToMongo = require("./connection")
require("dotenv").config()

ConnectToMongo()

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json())
app.use()

const authRoutes = require('./routes/user')

app.use("/api/auth", authRoutes)

app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT} 🔥`);
})
