const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const userRouter = require('./routes/router'); // Import the user router
require("./conn");

const app = express();
require('dotenv').config();

// Middleware to parse JSON data
app.use(bodyParser.json());

// Apply CORS middleware
app.use(cors());

// Directly use the user router without a prefix
app.use(userRouter);

// Start the server
const port = process.env.PORT || 3400;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
//DefaultData();
