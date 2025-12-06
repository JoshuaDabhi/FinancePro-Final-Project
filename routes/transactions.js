const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Budget = require('../models/Budget');
const multer = require('multer');
const path = require('path');

// Multer Config
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }).single('receipt');

router.post('/add', (req, res) => {
    upload(req, res, async (err) => {
        if(err) return res.redirect('/dashboard');

        const { type, amount, category, description } = req.body;
        const userId = req.session.user._id;

        try {
            const newTransaction = new Transaction({
                user: userId, type, amount, category, description,
                receipt: req.file ? req.file.filename : null 
            });
            await newTransaction.save();

            const user = await User.findById(userId);
            if (type === 'income') user.currentBalance += parseFloat(amount);
            else user.currentBalance -= parseFloat(amount);
            await user.save();
            req.session.user = user;

            // BUDGET WARNING LOGIC
            if (type === 'expense') {
                const budget = await Budget.findOne({ user: userId, category: category });
                if (budget) {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const stats = await Transaction.aggregate([
                        { $match: { user: user._id, category: category, type: 'expense', date: { $gte: firstDay } }},
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ]);
                    const totalSpent = stats.length > 0 ? stats[0].total : 0;
                    
                    if (totalSpent >= budget.limit) req.session.alert = `⚠️ Warning: You exceeded your ${category} budget!`;
                    else if (totalSpent >= (budget.limit * 0.8)) req.session.alert = `ℹ️ Notice: You are nearing your ${category} budget limit.`;
                }
            }

            res.redirect('/dashboard');
        } catch (error) {
            console.error(error);
            res.send("Error saving transaction");
        }
    });
});

router.post('/delete/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        const user = await User.findById(req.session.user._id);
        if (transaction.type === 'income') user.currentBalance -= transaction.amount;
        else user.currentBalance += transaction.amount;
        await user.save();
        await Transaction.findByIdAndDelete(req.params.id);
        req.session.user = user;
        res.redirect('/dashboard');
    } catch (err) { res.redirect('/dashboard'); }
});

module.exports = router;