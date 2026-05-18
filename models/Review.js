const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  replyFromReviewee: {
    type: String,
    trim: true,
    maxlength: 500,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure one review per user per product
reviewSchema.index({ fromUserId: 1, productId: 1 }, { unique: true });
reviewSchema.index({ toUserId: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
