import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '5m' }, // ၅ မိနစ်ပြည့်ရင် database ထဲက အလိုအလျောက် ပျက်သွားမည်။
  },
});

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
