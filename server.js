//Import express and path modules
const express = require('express');
const path = require('path');
//Import file handling libraries for MULTER
const multer = require('multer');
const fs = require('fs');
// Import CSV parser
const csv = require('csv-parser');

// Import our custom modules using the new naming convention
const { pool, initializeDatabase } = require('./db-client');
const { validateEntry, cleanInput } = require('./processor');

const app = express();

//MULTER setup to handle file uploads
const uploadDir = './temp_uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure multer to store files in our temp folder
const loader = multer({ 
    dest: uploadDir,
    limits: { fileSize: 2 * 1024 * 1024 } 
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

//BULK CSV upload handling
app.post('/bulk-upload', loader.single('csv_doc'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: "No file was uploaded." });
    }

    const filePath = req.file.path;
    const validRecords = [];
    const invalidRecords = [];

    // We wrap the stream in a Promise to ensure we wait for it to finish before responding
    try {
        await new Promise((resolve, reject) => {
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    // Map CSV headers to our expected keys
                    const entry = {
                        fname: row.fname || row.First_Name,
                        lname: row.lname || row.Last_Name || row.second_name,
                        email: row.email || row.Email,
                        phone: row.phone || row.Phone_Number || row.phone_number,
                        zipcode: row.zipcode || row.Zipcode || row.eircode
                    };

                    const rowErrors = validateEntry(entry);

                    if (Object.keys(rowErrors).length === 0) {
                        // Sanitize and push to bulk array
                        validRecords.push([
                            cleanInput(entry.fname),
                            cleanInput(entry.lname),
                            cleanInput(entry.email),
                            cleanInput(entry.phone),
                            cleanInput(entry.zipcode)
                        ]);
                    } else {
                        invalidRecords.push({ data: entry, errors: rowErrors });
                    }
                })
                .on('end', resolve)
                .on('error', reject);
        });

        // If we have valid records, perform a bulk insert
        if (validRecords.length > 0) {
            const bulkSQL = `INSERT INTO customer_leads (fname, lname, email, phone, zipcode) VALUES ?`;
            await pool.query(bulkSQL, [validRecords]);
        }

        res.json({
            msg: `Processing complete. ${validRecords.length} records imported.`,
            invalidCount: invalidRecords.length,
            details: invalidRecords
        });

    } catch (error) {
        console.error("Bulk Upload Error:", error);
        res.status(500).json({ msg: "Failed to process CSV file." });
    } finally {
        // Always delete the temp file to save disk space
        fs.unlink(filePath, (err) => {
            if (err) console.error("Cleanup Error:", err);
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