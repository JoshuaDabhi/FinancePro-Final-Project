const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// 1. Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

// 2. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');

// 3. Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: true
}));

// 4. Global Variables (for alerts)
app.use((req, res, next) => {
    res.locals.sessionAlert = req.session.alert || null;
    delete req.session.alert;
    next();
});

// 5. Routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/transactions', require('./routes/transactions'));
app.use('/bills', require('./routes/bills'));
app.use('/features', require('./routes/features'));
app.use('/reports', require('./routes/reports'));

// 6. Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));