const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const dataFile = path.join(__dirname, "data", "emergencies.json");

function readEmergencies() {
    try {
        if (!fs.existsSync(dataFile)) {
            return [];
        }

        const data = fs.readFileSync(dataFile, "utf8");
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error reading emergencies:", error);
        return [];
    }
}

function saveEmergencies(emergencies) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(emergencies, null, 2),
        "utf8"
    );
}

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CollegeSOS server is running"
    });
});

app.get("/api/emergencies", (req, res) => {
    const emergencies = readEmergencies();
    res.json(emergencies);
});

app.post("/api/emergencies", (req, res) => {
    try {
        const {
            name,
            type,
            location,
            description
        } = req.body;

        if (!location || !location.trim()) {
            return res.status(400).json({
                success: false,
                message: "Emergency location is required."
            });
        }

        const emergencies = readEmergencies();

        const emergency = {
            id: Date.now(),
            name: name || "Anonymous",
            type: type || "Other",
            location: location.trim(),
            description: description || "",
            status: "ACTIVE",
            time: new Date().toISOString(),
            suggestions:
                "Stay in a safe location. Move away from immediate hazards if possible. Ask a nearby staff member for help. Wait for trained responders. Contact emergency services for serious danger."
        };

        emergencies.unshift(emergency);
        saveEmergencies(emergencies);

        res.status(201).json({
            success: true,
            emergency
        });

    } catch (error) {
        console.error("Emergency creation error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save emergency."
        });
    }
});

app.put("/api/emergencies/:id", (req, res) => {
    try {
        const id = Number(req.params.id);
        const emergencies = readEmergencies();

        const emergency = emergencies.find(
            item => item.id === id
        );

        if (!emergency) {
            return res.status(404).json({
                success: false,
                message: "Emergency not found."
            });
        }

        if (req.body.status) {
            emergency.status = req.body.status;
        }

        saveEmergencies(emergencies);

        res.json({
            success: true,
            emergency
        });

    } catch (error) {
        console.error("Emergency update error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update emergency."
        });
    }
});

if (!process.env.VERCEL) {
    app.listen(3001, () => {
        console.log(
            "🚨 CollegeSOS server running on http://localhost:3001"
        );
    });
}

module.exports = { app };