const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  description: { type: String },
  receipt: { type: String, required: false },
  date: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Transaction', TransactionSchema);