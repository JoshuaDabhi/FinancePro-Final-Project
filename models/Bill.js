const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true }, // <--- NEW FIELD
  dueDate: { type: Date, required: true },
  dueTime: { type: String, required: false },
  status: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' }
});

module.exports = mongoose.model('Bill', BillSchema);