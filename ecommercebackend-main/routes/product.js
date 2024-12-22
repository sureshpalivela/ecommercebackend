const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');
const Seller = require('../models/seller'); 

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
const upload = multer({ storage });

router.post('/add', upload.array('images', 5), async (req, res) => {
  try {
    const { name, price, category, description, inStockValue, sellerId } = req.body;

    // Verify seller existence
    const seller = await Seller.findOne({ sellerId });
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Generate a unique product ID
    const productId = `PROD${Math.floor(100000 + Math.random() * 900000)}`;

    // Collect image file paths
    const images = req.files.map(file => file.path);

    // Create a new product
    const product = new Product({
      name,
      price,
      category,
      description,
      images,
      productId,
      inStockValue,
      sellerId,
    });

    await product.save();

    res.status(201).json({ message: 'Product added successfully', product });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Error adding product' });
  }
});

// Remove a product
router.delete('/remove/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findOneAndDelete({ productId });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product removed successfully' });
  } catch (error) {
    console.error('Error removing product:', error);
    res.status(500).json({ error: 'Error removing product' });
  }
});

// Get all products for a specific seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    const products = await Product.find({ sellerId });
    if (!products.length) {
      return res.status(404).json({ message: 'No products found for this seller' });
    }

    res.status(200).json({ products });
  } catch (error) {
    console.error('Error fetching products for seller:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

module.exports = router;
