const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Bill = require('../models/Bill');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');

const ensureAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/');
};

router.get('/', (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login');
});

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const now = new Date();
        // Reset "now" to start of day to ensure accurate comparisons
        now.setHours(0,0,0,0); 

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Fetch Data
        const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });
        const bills = await Bill.find({ user: userId, status: 'unpaid' }).sort({ dueDate: 1 });
        const budgets = await Budget.find({ user: userId });
        const goals = await Goal.find({ user: userId });

        // 2. Budget Calculation
        const budgetData = budgets.map(budget => {
            const spent = transactions
                .filter(t => t.type === 'expense' && t.category === budget.category && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
                .reduce((acc, t) => acc + t.amount, 0);
            return {
                _id: budget._id,
                category: budget.category,
                limit: budget.limit,
                spent: spent,
                percentage: Math.min((spent / budget.limit) * 100, 100)
            };
        });

        // 3. ALERT LOGIC UPDATE
        const fiveDaysLater = new Date();
        fiveDaysLater.setDate(now.getDate() + 5);

        const alerts = bills.filter(bill => {
            const due = new Date(bill.dueDate);
            // If bill is unpaid AND (Overdue OR Due in next 5 days)
            // We simply check if date is less than 5 days from now. 
            // Since we sorted bills by status='unpaid', this covers all overdue bills too.
            return due <= fiveDaysLater;
        });

        // 4. Totals & Charts
        const totalExpenses = transactions
            .filter(t => t.type === 'expense' && t.date.getMonth() === currentMonth && t.date.getFullYear() === currentYear)
            .reduce((acc, t) => acc + t.amount, 0);

        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryTotals = expenseTransactions.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        res.render('dashboard', { 
            user: req.session.user,
            transactions,
            bills,
            alerts,
            budgets: budgetData,
            goals,
            totalExpenses: totalExpenses.toFixed(2),
            chartLabels: JSON.stringify(Object.keys(categoryTotals)),
            chartData: JSON.stringify(Object.values(categoryTotals))
        });
    } catch (err) {
        console.error(err);
        res.redirect('/');
    }
});

module.exports = router;