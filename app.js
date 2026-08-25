const EMERGENCY_STORAGE_KEY = "campusSOS.emergencies";

function getLocalEmergencies() {
    try {
        const data = localStorage.getItem(EMERGENCY_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        return [];
    }
}

function saveLocalEmergencies(emergencies) {
    try {
        localStorage.setItem(EMERGENCY_STORAGE_KEY, JSON.stringify(emergencies));
    } catch (error) {
        console.error("Local emergency save failed:", error);
    }
}

async function submitEmergency() {

    const name = document.getElementById("name").value;
    const type = document.getElementById("type").value;
    const location = document.getElementById("location").value;
    const description = document.getElementById("description").value;

    if (!location.trim()) {
        alert("Please enter the emergency location.");
        return;
    }

    const resultBox = document.getElementById("result");
    const safetyBox = document.getElementById("safetyBox");
    const safetySuggestions = document.getElementById("safetySuggestions");

    if (resultBox) {
        resultBox.innerHTML = "Sending SOS...";
    }

    const emergencyPayload = {
        id: Date.now(),
        name: name || "Anonymous",
        type: type || "Other",
        location: location || "Unknown",
        description: description || "",
        status: "ACTIVE",
        time: new Date().toISOString(),
        suggestions: "Stay in a safe location. Move away from immediate hazards if possible. Ask a nearby staff member for help. Wait for trained responders. Contact emergency services for serious danger."
    };

    try {
        const response = await fetch("/api/emergencies", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: emergencyPayload.name,
                type: emergencyPayload.type,
                location: emergencyPayload.location,
                description: emergencyPayload.description
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to send SOS right now.");
        }

        emergencyPayload.suggestions = data.emergency?.suggestions || emergencyPayload.suggestions;

        if (resultBox) {
            resultBox.innerHTML = "🚨 SOS SENT — Campus response team has been alerted.";
        }

        if (safetyBox) {
            safetyBox.style.display = "block";
        }

        if (safetySuggestions) {
            safetySuggestions.innerText = emergencyPayload.suggestions;
        }

    } catch (error) {
        console.error("SOS fallback used:", error);

        const localEmergencies = getLocalEmergencies();
        localEmergencies.unshift(emergencyPayload);
        saveLocalEmergencies(localEmergencies);

        if (resultBox) {
            resultBox.innerHTML = "🚨 SOS SENT — Campus response team has been alerted.";
        }

        if (safetyBox) {
            safetyBox.style.display = "block";
        }

        if (safetySuggestions) {
            safetySuggestions.innerText = emergencyPayload.suggestions;
        }
    }

    document.getElementById("name").value = "";
    document.getElementById("location").value = "";
    document.getElementById("description").value = "";
}


// Load emergencies for admin
async function loadEmergencies() {

    const list = document.getElementById("emergencyList");
    if (!list) return;

    let emergencies = getLocalEmergencies();

    try {
        const response = await fetch("/api/emergencies");
        if (response.ok) {
            emergencies = await response.json();
            saveLocalEmergencies(emergencies);
        }
    } catch (error) {
        console.warn("Using local emergency data:", error);
    }

    if (!Array.isArray(emergencies)) {
        emergencies = [];
    }

    list.innerHTML = "";

    let active = 0;
    let resolved = 0;

    emergencies.forEach((emergency) => {

        if (emergency.status === "ACTIVE") {
            active++;
        }

        if (emergency.status === "RESOLVED") {
            resolved++;
        }

        const card = document.createElement("div");

        card.className = "emergency-card";

        card.innerHTML = `

            <h2>
                ${getIcon(emergency.type)}
                ${emergency.type}
            </h2>

            <p>
                <strong>Student:</strong>
                ${emergency.name}
            </p>

            <p>
                <strong>Location:</strong>
                ${emergency.location}
            </p>

            <p>
                <strong>Description:</strong>
                ${emergency.description}
            </p>

            <p>
                <strong>Status:</strong>
                ${emergency.status}
            </p>

            ${
                emergency.status !== "RESOLVED"
                ? `<button onclick="resolveEmergency(${emergency.id})">Mark Resolved</button>`
                : ""
            }

        `;

        list.appendChild(card);
    });

    document.getElementById("total").innerText = emergencies.length;
    document.getElementById("active").innerText = active;
    document.getElementById("resolved").innerText = resolved;
}


// Resolve emergency
async function resolveEmergency(id) {

    const localEmergencies = getLocalEmergencies();
    const emergency = localEmergencies.find((item) => item.id === id);

    if (emergency) {
        emergency.status = "RESOLVED";
        saveLocalEmergencies(localEmergencies);
    }

    try {
        await fetch(`/api/emergencies/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: "RESOLVED"
            })
        });
    } catch (error) {
        console.warn("Resolve fallback used:", error);
    }

    loadEmergencies();
}


// Emergency icons
function getIcon(type) {

    if (type === "Medical") return "🏥";

    if (type === "Fire") return "🔥";

    if (type === "Security") return "🛡️";

    return "⚠️";
}


// Automatically load dashboard
if (document.getElementById("emergencyList")) {
    loadEmergencies();
    setInterval(loadEmergencies, 3000);
}