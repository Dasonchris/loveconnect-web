// server/models/Product.js  ← for Marketplace.jsx
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  description: { type: String, default: '' },
  image:       { type: String, default: '' },
  category:    { type: String, default: 'other' },
  sold:        { type: Boolean, default: false },
  soldTo:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  soldMessage: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);