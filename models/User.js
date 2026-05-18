/* const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: /^\+?[0-9]{9,13}$/, // မြန်မာဖုန်းနံပါတ် format
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  // ✅ Added password field
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  profileImageUrl: {
    type: String,
    default: null,
  },
  location: {
    city: { type: String, required: true }, // ရန်ကုန်၊ မန္တလေး စသည်
    township: { type: String, required: true }, // မြို့နယ်
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  trustScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  totalReports: {
    type: Number,
    default: 0,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  preferredLanguage: {
    type: String,
    enum: ['my', 'en'],
    default: 'my',
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

// Geospatial index for nearby search
userSchema.index({ 'location.coordinates': '2dsphere' });

// Text search on name
userSchema.index({ name: 'text' });

// Pre-save hook to hash password (improved with existence check)
userSchema.pre('save', async function (next) {
  // Only hash if password is modified and exists
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare password (with undefined protection)
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};
const User = mongoose.model('User', userSchema);
export default User;
