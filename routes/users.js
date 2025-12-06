const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 1. Render Register Page
router.get('/register', (req, res) => {
    res.render('register');
});

// 2. Handle Registration Logic
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        // Check if user already exists
        let user = await User.findOne({ email: email });
        if (user) {
            return res.send('User already exists. <a href="/">Try Login</a>');
        }

        // Create new user object
        user = new User({ name, email, password });

        // Encrypt Password (Hashing)
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Save to Database
        await user.save();
        
        // Go to Login page
        res.redirect('/');
        
    } catch (err) {
        console.error(err);
        res.send('Error during registration');
    }
});

// 3. Handle Login Logic
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.send('User not found. <a href="/users/register">Register</a>');
        }

        // Match Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.send('Incorrect Password. <a href="/">Try Again</a>');
        }

        // Create Session (Log them in)
        req.session.user = user; // Save user info in the session
        res.redirect('/dashboard');

    } catch (err) {
        console.error(err);
        res.send('Server Error');
    }
});

// 4. Logout Handle
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

module.exports = router;