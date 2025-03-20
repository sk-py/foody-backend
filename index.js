const express = require("express")
const ConnectToMongo = require("./connection")
require("dotenv").config()

ConnectToMongo()

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json())


const authRoutes = require('./routes/user')
const emailRoutes = require('./routes/email')
const callRoutes = require('./routes/call')


app.use("/api/auth", authRoutes)
app.use("/api/email", emailRoutes)
app.use("/api/call", callRoutes)

app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🔥`);
})
