const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const publicDir = path.join(__dirname, "data", "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

app.get("/", (req, res) => {
    res.sendFile(path.join(publicDir, "index.html"));
});

const dataFile = path.join(__dirname, "data", "emergencies.json");

// Read emergencies
function getEmergencies() {
    try {
        const data = fs.readFileSync(dataFile, "utf8");
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save emergencies
function saveEmergencies(emergencies) {
    fs.writeFileSync(
        dataFile,
        JSON.stringify(emergencies, null, 2)
    );
}
async function getSafetySuggestions(type, description) {

    if (!genAI) {
        return `Stay in a safe location.
Move away from immediate hazards if possible.
Ask a nearby staff member for help.
Wait for trained responders.
For serious emergencies, contact emergency services.`;
    }

    try {

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash"
        });

        const prompt = `
You are a campus emergency safety assistant.

Emergency type:
${type}

Situation:
${description}

Give short, calm and safe guidance for the person
while trained campus responders are arriving.

Rules:
- Do not diagnose medical conditions.
- Do not recommend medicines or risky procedures.
- Do not give dangerous instructions.
- Give 3 to 5 simple immediate safety steps.
- Tell the person to move away from danger if possible.
- Recommend contacting trained campus responders/emergency services
  for serious or life-threatening situations.
- Keep the answer under 100 words.
- Use simple language.

Return ONLY the safety steps.
`;

        const result = await model.generateContent(prompt);

        const response = await result.response;

        return response.text();

    } catch (error) {

        console.error("Gemini Error:", error);

        return `
Stay in a safe location.
Move away from immediate hazards if possible.
Ask a nearby staff member for help.
Wait for trained responders.
For serious emergencies, contact emergency services.
`;

    }
}
// Test route
app.get("/api/test", (req, res) => {
    res.json({
        message: "CampusSOS backend is working!"
    });
});

// Get all emergencies
app.get("/api/emergencies", (req, res) => {
    const emergencies = getEmergencies();
    res.json(emergencies);
});

// Create emergency
app.post("/api/emergencies", async (req, res) => {

    const emergencies = getEmergencies();

    const name = req.body.name || "Anonymous";
    const type = req.body.type || "Other";
    const location = req.body.location || "Unknown";
    const description = req.body.description || "";

    // Ask Gemini for immediate safety guidance
    const suggestions = await getSafetySuggestions(
        type,
        description
    );

    const emergency = {

        id: Date.now(),

        name: name,

        type: type,

        location: location,

        description: description,

        status: "ACTIVE",

        time: new Date().toISOString(),

        suggestions: suggestions

    };

    emergencies.unshift(emergency);

    saveEmergencies(emergencies);

    res.json({

        success: true,

        emergency: emergency

    });

});

// Update emergency status
app.put("/api/emergencies/:id", (req, res) => {
    const emergencies = getEmergencies();

    const id = Number(req.params.id);

    const emergency = emergencies.find(item => item.id === id);

    if (!emergency) {
        return res.status(404).json({
            success: false,
            message: "Emergency not found"
        });
    }

    emergency.status = req.body.status;

    saveEmergencies(emergencies);

    res.json({
        success: true,
        emergency
    });
});

app.listen(PORT, "127.0.0.1", () => {
    console.log(`CampusSOS running at http://localhost:${PORT}`);
});