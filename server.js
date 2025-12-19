// Import express and path modules
const express = require('express');
const path = require('path');
// Import file handling libraries
const multer = require('multer');
const fs = require('fs');

// Import our custom modules using the new naming convention
const { pool, initializeDatabase } = require('./db-client');
const { validateEntry, cleanInput } = require('./processor');

const app = express();

//multer configuration block - This creates a 'temp_uploads' folder if it doesn't exist to prevent errors
const uploadDir = './temp_uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure multer to store files in our temp folder
const loader = multer({ 
    dest: uploadDir,
    limits: { fileSize: 2 * 1024 * 1024 } // Limit to 2MB for safety
});


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

// Post method to handle data coming from the 'Manual Entry' form
app.post('/post-entry', async (req, res) => {
    const errors = validateEntry(req.body); 

    if (Object.keys(errors).length > 0) {
        console.log("Validation failed for a manual entry.");
        return res.status(400).json({
            msg: "Validation has failed. Please check the fields below.",
            errors: errors
        });
    }

    const { fname, lname, email, phone, zipcode } = req.body;
    
    const safeData = [
        cleanInput(fname),
        cleanInput(lname),
        cleanInput(email),
        cleanInput(phone),
        cleanInput(zipcode)
    ];

    const insertSQL = `
        INSERT INTO customer_leads (fname, lname, email, phone, zipcode)
        VALUES (?, ?, ?, ?, ?)
    `;

    try {
        await pool.query(insertSQL, safeData);
        res.status(201).json({ 
            msg: "Success! The lead has been securely saved to the database." 
        });
    } catch (dbError) {
        console.error("Database Error:", dbError);
        res.status(500).json({ 
            msg: "Internal Server Error: Could not save lead to the database." 
        });
    }
});

// Start Server and Initialize DB
const PORT = 3000;
app.listen(PORT, async () => {
    try {
        await initializeDatabase();
        console.log(`Server is running non-stop on http://localhost:${PORT}`);
    } catch (err) {
        console.error("Failed to start system:", err);
    }
});