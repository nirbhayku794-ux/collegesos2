const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CollegeSOS server is running"
    });
});

// GET all emergencies
app.get("/api/emergencies", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("emergencies")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase GET error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to fetch emergencies."
            });
        }

        const emergencies = data.map(item => ({
            ...item,
            time: item.created_at
        }));

        res.json(emergencies);

    } catch (error) {
        console.error("Emergency fetch error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to fetch emergencies."
        });
    }
});

// CREATE emergency
app.post("/api/emergencies", async (req, res) => {
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

        const emergency = {
            name: name || "Anonymous",
            type: type || "Other",
            location: location.trim(),
            description: description || "",
            status: "ACTIVE"
        };

        const { data, error } = await supabase
            .from("emergencies")
            .insert([emergency])
            .select()
            .single();

        if (error) {
            console.error("Supabase INSERT error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to save emergency."
            });
        }

        res.status(201).json({
            success: true,
            emergency: {
                ...data,
                time: data.created_at
            }
        });

    } catch (error) {
        console.error("Emergency creation error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save emergency."
        });
    }
});

// UPDATE emergency status
app.put("/api/emergencies/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isFinite(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid emergency ID."
            });
        }

        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required."
            });
        }

        const { data, error } = await supabase
            .from("emergencies")
            .update({ status })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Supabase UPDATE error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to update emergency."
            });
        }

        res.json({
            success: true,
            emergency: {
                ...data,
                time: data.created_at
            }
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