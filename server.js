// const to import express, path and initializeDatabase from db-client.js
const express = require('express');
const path = require('path');
const { initializeDatabase } = require('./db-client');

// Create an Express application
const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

const PORT = 3000; //port number as requested
// Start the server and initialize the database
app.listen(PORT, async () => {
    await initializeDatabase();
    console.log(`Server live on port ${PORT}`);
});