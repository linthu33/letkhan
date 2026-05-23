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
  // ✅ ၁။ Phone Verification (အခြေခံအဆင့်)
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
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
    city: { type: String, required: true },
    township: { type: String, required: true },
    coordinates: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },

  // ✅ ၂။ Seller Verification (KYC - ရောင်းသူများအတွက် အဆင့်)
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'approved', 'rejected'],
    default: 'unverified',
  },
  identityVerification: {
    idType: {
      type: String,
      enum: ['NID', 'Passport', 'DriverLicense', null],
      default: null,
    }, // NID = National ID (မှတ်ပုံတင်)
    idNumber: { type: String, trim: true, default: null }, // မှတ်ပုံတင်နံပါတ် (ဥပမာ- ၁၂/လမန(နိုင်)၁၂၃၄၅၆)
    idFrontImageUrl: { type: String, default: null }, // မှတ်ပုံတင်အရှေ့မျက်နှာပြင်ပုံ
    idBackImageUrl: { type: String, default: null }, // မှတ်ပုံတင်အနောက်မျက်နှာပြင်ပုံ
    selfieWithIdUrl: { type: String, default: null }, // မှတ်ပုံတင်ကိုင်ပြီးရိုက်ထားသည့် Liveness Selfie ပုံ
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: null }, // ငြင်းပယ်ခံရပါက အကြောင်းပြချက်ပြရန်
  },

  // ✅ ၃။ Mobile Wallet / Bank Linkage (ငွေလွှဲ/ငွေထုတ် ခြေရာခံရန်)
  bankAccount: {
    provider: {
      type: String,
      enum: ['KBZPay', 'WaveMoney', 'KBZBank', 'CBBank', 'AYABank', null],
      default: null,
    },
    accountName: { type: String, trim: true, default: null }, // ဘဏ်အကောင့်နာမည် (မှတ်ပုံတင်နာမည်နှင့် တိုက်စစ်ရန်)
    accountNumber: { type: String, trim: true, default: null }, // ဖုန်းနံပါတ် သို့မဟုတ် အကောင့်နံပါတ်
    isLinked: { type: Boolean, default: false },
  },

  // ✅ ၄။ Trust & Reputation System (Platform တွင်း စိစစ်မှု)
  isVerified: {
    // ဤ field သည် true ဖြစ်သွားပါက App တွင် Blue Badge (အပြာရောင်အမှန်ခြစ်) ပြပေးမည်။
    type: Boolean,
    default: false,
  },
  trustScore: {
    type: Number,
    default: 5.0, // စစချင်းမှာ ၅ ပွင့်အပြည့်ပေးထားပြီး Report မိရင် လျှော့ချတာ ပိုအဆင်ပြေပါတယ်။
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

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
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

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
