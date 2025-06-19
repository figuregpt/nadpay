import mongoose from 'mongoose';

const PaymentLinkSchema = new mongoose.Schema({
  linkId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  creatorAddress: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  coverImage: {
    type: String,
    default: ''
  },
  price: {
    type: String,
    required: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  maxPerWallet: {
    type: Number,
    default: 0
  },
  salesCount: {
    type: Number,
    default: 0
  },
  totalEarned: {
    type: String,
    default: '0'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  purchases: [{
    buyerAddress: String,
    amount: Number,
    txHash: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
PaymentLinkSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.PaymentLink || mongoose.model('PaymentLink', PaymentLinkSchema); 