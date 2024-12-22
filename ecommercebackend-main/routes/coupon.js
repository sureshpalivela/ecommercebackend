const express = require('express');
const router = express.Router();
const Coupon = require('../models/couponmodel');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('../models/user'); // Adjust the path to your actual User model file
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // Convert string to boolean
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Utility to send emails to all users
async function sendEmailToAllUsers(subject, message) {
    try {
        const users = await User.find({}, 'email'); // Fetch user emails
        for (const user of users) {
            try {
                await transporter.sendMail({
                    from: 'pecommerce8@gmail.com',
                    to: user.email,
                    subject: subject,
                    text: message
                });
            } catch (emailError) {
                console.error(`Error sending email to ${user.email}:`, emailError);
            }
        }
    } catch (error) {
        console.error('Error fetching users or sending emails:', error);
    }
}

// Endpoint to create a new coupon
router.post('/create-coupon', async (req, res) => {
  try {
    const { code, discountPercentage } = req.body;

    const coupon = new Coupon({
      code,
      discountPercentage
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      coupon
    });

    // Notify users about the new coupon
    const subject = 'New Coupon Code Available!';
    const message = `Use code ${code} to get ${discountPercentage}% off on your next purchase.`;
    await sendEmailToAllUsers(subject, message);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating coupon',
      error: error.message
    });
  }
});

// Endpoint to validate a coupon
router.post('/validate-coupon', async (req, res) => {
  try {
    const { code } = req.body;

    const coupon = await Coupon.findOne({ code });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    res.status(200).json({
      success: true,
      discountPercentage: coupon.discountPercentage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      error: error.message
    });
  }
});

// Endpoint to delete a coupon
router.delete('/delete-coupon', async (req, res) => {
  try {
    const { code } = req.body;

    const deletedCoupon = await Coupon.findOneAndDelete({ code });

    if (!deletedCoupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Notify users about the coupon expiration
    const subject = 'Coupon Expired';
    const message = `The coupon code ${code} is no longer valid.`;
    await sendEmailToAllUsers(subject, message);

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting coupon',
      error: error.message
    });
  }
});

// Endpoint to get all coupons
router.get('/get-coupons', async (req, res) => {
  try {
    const coupons = await Coupon.find();
    res.status(200).json({
      success: true,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message
    });
  }
});

module.exports = router;
