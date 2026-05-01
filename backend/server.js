const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON and enable Cross-Origin Resource Sharing
app.use(cors());
// Crucial: Use express.text to accept raw JSON strings so we can validate it ourselves
app.use(express.text({ type: '*/*' }));

// We use a simple JSON file as our "Database" for speed and simplicity
const DB_FILE = path.join(__dirname, 'data.json');

// Ensure Database file exists when server starts
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}));
}

// DB Helper: Read Data
const readData = () => {
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
};

// DB Helper: Write Data
const writeData = (data) => {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

// ==========================================
// API ROUTES
// ==========================================

// 1. Generate a new Mock API endpoint
app.post('/api/generate', (req, res) => {
    try {
        let payload;
        
        // Check if the user sent valid JSON
        try {
            payload = JSON.parse(req.body);
        } catch (e) {
            return res.status(400).json({ error: "Invalid JSON format. Please check your syntax." });
        }

        // Generate a unique 8-character ID for the URL
        const id = uuidv4().substring(0, 8); 
        const data = readData();
        
        // Save the JSON payload to our database with the generated ID
        data[id] = payload;
        writeData(data);

        // Return the live URL to the frontend
        const mockUrl = `http://localhost:${PORT}/api/mock/${id}`;
        res.status(201).json({ 
            success: true, 
            id: id, 
            mockUrl: mockUrl 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 2. Fetch the mocked data (This is the URL developers will use)
app.get('/api/mock/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();

    if (data[id]) {
        // Return the EXACT JSON payload the user saved
        res.json(data[id]);
    } else {
        res.status(404).json({ error: "Mock API endpoint not found or expired." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Mock-It Backend running on http://localhost:${PORT}`);
    console.log(`📁 Database initialized at ${DB_FILE}`);
});
