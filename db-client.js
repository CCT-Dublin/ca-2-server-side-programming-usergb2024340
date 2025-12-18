//importing mysql in a const mysql
const mysql = require('mysql2/promise');

//creating the pool to connect to my database
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'Pass1234!',
    database: 'serverside_ca2',
    connectionLimit: 10
});

//creting a function that will create a table if it doesnt not exist in my database
async function initializeDatabase() {
    const schema = `
    CREATE TABLE IF NOT EXISTS customer_leads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        fname VARCHAR(50),
        lname VARCHAR(50),
        email VARCHAR(100),
        phone VARCHAR(15),
        zipcode VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`;
    await pool.query(schema);
    console.log("Database initialized.");
}

//exporting the methods/functions 
module.exports = { pool, initializeDatabase };