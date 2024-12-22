const mongoose = require('mongoose');

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true 
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0, 
    max: 100 
  },
  expirationDate: {
    type: Date, 
    required: false
  },
  isActive: {
    type: Boolean,
    default: true 
  },
  createdAt: {
    type: Date,
    default: Date.now 
  }
});

couponSchema.pre('save', function (next) {
  this.code = this.code.toUpperCase(); 
  next();
});

couponSchema.statics.validateCoupon = async function (code) {
  const coupon = await this.findOne({ code: code.toUpperCase(), isActive: true });
  if (!coupon) {
    throw new Error('Invalid or expired coupon code');
  }
  return coupon.discountPercentage;
};

module.exports = Coupon;
