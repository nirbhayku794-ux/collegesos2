const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CollegeSOS server is running"
    });
});

app.listen(3001, () => {
    console.log("🚨 CollegeSOS server running on http://localhost:3001");
});

module.exports = { app };
