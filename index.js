const express = require("express")
const ConnectToMongo = require("./connection")
const cors = require("cors")
require("dotenv").config()

ConnectToMongo()

const PORT = process.env.PORT || 3000;

const app = express();



app.use(express.json())
app.use(cors())


const authRoutes = require('./routes/user')
const emailRoutes = require('./routes/email')
const callRoutes = require('./routes/call')
const faceRoutes = require('./routes/face')


app.use("/api/auth", authRoutes)
app.use("/api/email", emailRoutes)
app.use("/api/call", callRoutes)
app.use("/api/face", faceRoutes)

app.get("/", (req, res) => {
    res.send("Hello World!")
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} 🔥`);
}).on('error', (err) => {
    console.error('Server error:', err.message);
});


