const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const User = require('../models/User');

router.post('/budget/add', async (req, res) => {
    const { category, limit } = req.body;
    let budget = await Budget.findOne({ user: req.session.user._id, category });
    if (budget) { budget.limit = limit; await budget.save(); }
    else { await new Budget({ user: req.session.user._id, category, limit }).save(); }
    res.redirect('/dashboard');
});

router.post('/budget/delete/:id', async (req, res) => {
    await Budget.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});

router.post('/goal/add', async (req, res) => {
    await new Goal({ user: req.session.user._id, title: req.body.title, targetAmount: req.body.targetAmount }).save();
    res.redirect('/dashboard');
});

router.post('/goal/contribute/:id', async (req, res) => {
    const contribution = parseFloat(req.body.amount);
    const goal = await Goal.findById(req.params.id);
    const user = await User.findById(req.session.user._id);
    if (user.currentBalance >= contribution) {
        user.currentBalance -= contribution;
        goal.savedAmount += contribution;
        await user.save(); await goal.save();
        req.session.user = user;
    }
    res.redirect('/dashboard');
});

router.post('/goal/delete/:id', async (req, res) => {
    await Goal.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard');
});

module.exports = router;