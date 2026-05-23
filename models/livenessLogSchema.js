import mongoose from 'mongoose';

const LivenessLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // သင်ဆောက်ထားတဲ့ User Model ရှိရင် တွဲပေးလို့ရပါတယ်
    required: true,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PASSED', 'FAILED'],
    default: 'PENDING',
  },
  fileUrl: {
    type: String, // သိမ်းထားတဲ့ ဗီဒီယို သို့မဟုတ် ပုံရဲ့ server path (သို့) S3 URL
    required: true,
  },
  confidenceScore: {
    type: Number, // AI က စစ်ပေးလိုက်တဲ့ သေချာမှု ရာခိုင်နှုန်း (ဥပမာ - 98.5)
    default: 0,
  },
  attemptedAt: {
    type: Date,
    default: Date.now, // စစ်ဆေးခဲ့တဲ့ အချိန်
  },
});

const LivenessLog = mongoose.model('LivenessLog', LivenessLogSchema);
export default LivenessLog;
