const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const PDFDocument = require('pdfkit');

router.get('/csv', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const transactions = await Transaction.find({ user: req.session.user._id }).sort({ date: -1 });
    let csv = 'Date,Type,Category,Description,Amount\n';
    transactions.forEach(t => {
        csv += `${t.date.toISOString().split('T')[0]},${t.type},${t.category},"${t.description || ''}",${t.amount}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('finance_report.csv');
    res.send(csv);
});

router.get('/pdf', async (req, res) => {
    if (!req.session.user) return res.redirect('/');
    const transactions = await Transaction.find({ user: req.session.user._id }).sort({ date: -1 });
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=finance_report.pdf');
    doc.pipe(res);
    doc.fontSize(20).text('Financial Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`User: ${req.session.user.name}`);
    doc.text(`Date: ${new Date().toDateString()}`);
    doc.moveDown();
    doc.fontSize(10).font('Helvetica-Bold').text('Date         Category        Type       Amount', { underline: true });
    doc.font('Helvetica');
    transactions.forEach(t => {
        const date = t.date.toISOString().split('T')[0];
        const type = t.type.toUpperCase();
        const amount = t.type === 'income' ? `+$${t.amount}` : `-$${t.amount}`;
        doc.text(`${date}   ${t.category.padEnd(15)} ${type.padEnd(10)} ${amount}`);
    });
    doc.end();
});

module.exports = router;