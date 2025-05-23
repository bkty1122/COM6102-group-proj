// app.js
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const questionBankRoutes = require('./routes/questionBankRoutes');
const exportRoutes = require('./routes/exportRoutes');
const mediaRoutes = require('./routes/mediaRoutes'); // Media routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Routes
app.use('/api/question-banks', questionBankRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/media', mediaRoutes); // Media routes

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Form Builder API' });
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;