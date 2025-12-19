const express = require('express');
const path = require('path');

// Import our custom modules using the new naming convention
const { pool, initializeDatabase } = require('./db-client');
const { validateEntry, cleanInput } = require('./processor');

const app = express();

// Middleware
app.use(express.json());
// extended: true allows for rich objects and arrays to be encoded into the URL-encoded format
app.use(express.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));

//Post method to handle data coming from the 'Manual Entry' form
app.post('/post-entry', async (req, res) => {
    const errors = validateEntry(req.body); //Capture and Validate

    //Check if validation failed
    if (Object.keys(errors).length > 0) {
        console.log("Validation failed for a manual entry.");
        return res.status(400).json({
            msg: "Validation has failed. Please check the fields below.",
            errors: errors
        });
    }

    //Destructure and Sanitize (XSS Protection)
    const { fname, lname, email, phone, zipcode } = req.body;
    
    const safeData = [
        cleanInput(fname),
        cleanInput(lname),
        cleanInput(email),
        cleanInput(phone),
        cleanInput(zipcode)
    ];

    // Database Insertion using Prepared Statements (SQL Injection Protection)
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