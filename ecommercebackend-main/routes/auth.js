const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Seller = require('../models/seller'); // Adjust the path to your Seller model
const Admin = require('../models/admin'); // Adjust the path to your Admin model
const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Middleware for role-based authentication
const roleAuthentication = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const { userId, sellerId, adminId } = req.session;

      if (!userId && !sellerId && !adminId) {
        return res.status(401).json({ error: 'Unauthorized. Login required.' });
      }

      let user = null;
      if (userId) {
        user = await User.findById(userId);
      } else if (sellerId) {
        user = await Seller.findOne({ sellerId });
      } else if (adminId) {
        user = await Admin.findById(adminId);
      }

      if (!user || !allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Access forbidden. Insufficient permissions.' });
      }

      req.user = user; // Attach user to request for further usage
      next();
    } catch (error) {
      console.error('Error in role-based authentication middleware:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  };
};

// User Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const userId = require('crypto').randomBytes(8).toString('hex');
    const user = new User({ name, email, password: hashedPassword, userId, phone, role: 'user' });
    await user.save();

    res.status(201).json({ message: 'User registered successfully', userId });
  } catch (error) {
    console.error('Error during user signup:', error);
    res.status(500).json({ error: 'Error registering user' });
  }
});

// User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Save userId in session
    req.session.userId = user.userId;

    res.status(200).json({ message: 'Login successful', userId: user.userId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Seller Sign Up
router.post('/seller/signup', async (req, res) => {
  try {
    const { name, email, password, businessName, businessAddress } = req.body;

    // Check if seller exists
    const existingSeller = await Seller.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({ error: 'Seller already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create seller
    const sellerId = `MBSLR${Math.floor(10000 + Math.random() * 90000)}`;
    const seller = new Seller({
      name,
      email,
      password: hashedPassword,
      sellerId,
      businessName,
      businessAddress,
      role: 'seller'
    });
    await seller.save();

    res.status(201).json({ message: 'Seller registered successfully', sellerId });
  } catch (error) {
    console.error('Error during seller signup:', error);
    res.status(500).json({ error: 'Error registering seller' });
  }
});

// Seller Login
router.post('/seller/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find seller by email
    const seller = await Seller.findOne({ email });
    if (!seller) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Save sellerId in session
    req.session.sellerId = seller.sellerId;

    res.status(200).json({ message: 'Login successful', sellerId: seller.sellerId });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Save adminId in session
    req.session.adminId = admin.id;

    res.status(200).json({ message: 'Login successful', adminId: admin.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error logging in' });
  }
});

// Role-Based Dashboard Routes
router.get('/admin/dashboard', roleAuthentication(['admin']), (req, res) => {
  res.status(200).json({ message: 'Welcome to the Admin Dashboard' });
});

router.get('/seller/dashboard', roleAuthentication(['seller']), (req, res) => {
  res.status(200).json({ message: 'Welcome to the Seller Dashboard' });
});

module.exports = router;
