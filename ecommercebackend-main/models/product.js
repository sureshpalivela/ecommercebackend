const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  name: String,
  price: String,
  images: [String],
  category: String,
  rating: Number,
  productId: { type: String, unique: true }, // Added productId field
  inStockValue: Number, // Available stock value
  soldStockValue: Number, // Number of items sold
  visibility: { type: String, default: 'on' }, // Visibility field with default 'on'
  sellerId : String,
  description : String
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;