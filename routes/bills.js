const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// 1. Add Bill (Now accepts Category)
router.post('/add', async (req, res) => {
    // Destructure category from the form
    const { title, amount, category, dueDate, dueTime } = req.body; 
    try {
        const fixedDate = new Date(dueDate + 'T12:00:00');

        await new Bill({ 
            user: req.session.user._id, 
            title, 
            amount, 
            category, // <--- Save the Category
            dueDate: fixedDate, 
            dueTime 
        }).save();
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

// 2. Pay Bill (Uses the Bill's Category for the Transaction)
router.post('/pay/:id', async (req, res) => {
    try {
        const bill = await Bill.findById(req.params.id);
        
        if(bill.status === 'unpaid') {
            bill.status = 'paid';
            await bill.save();
            
            // Create Expense Transaction
            await new Transaction({
                user: req.session.user._id, 
                type: 'expense', 
                amount: bill.amount,
                category: bill.category, // <--- USE BILL CATEGORY (e.g., 'Rent')
                description: `Payment for: ${bill.title}`
            }).save();

            // Update User Balance
            const user = await User.findById(req.session.user._id);
            user.currentBalance -= bill.amount;
            await user.save();
            req.session.user = user;
        }
        res.redirect('/dashboard');
    } catch (err) { 
        console.error(err);
        res.redirect('/dashboard'); 
    }
});

// 3. Delete Bill
router.post('/delete/:id', async (req, res) => {
    await Bill.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});

module.exports = router;