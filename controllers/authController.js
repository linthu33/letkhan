import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import Otp from '../models/Otp.js';
import axios from 'axios';
import LivenessLog from '../models/livenessLogSchema.js';

//const base64Credentials = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
// ==================== Generate JWT ====================
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    {
      id: String(user._id),
      role: user.role || 'user',
      phone: user.phone,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// ==================== REGISTER ====================
export const register = async (req, res) => {
  try {
    console.log(req.body);
    const {
      phone,
      name,
      password,
      location, // Frontend က ပို့လိုက်တဲ့ object ကို ယူတယ်
    } = req.body;

    const { city, township } = location || {};

    // ၁။ မဖြစ်မနေလိုအပ်သော Fields များကို စစ်ဆေးခြင်း
    // 💡 city နဲ့ township ပါဝင်မှု ရှိ/မရှိ ပါ တစ်ခါတည်း သေချာအောင် စစ်ဆေးထားပါတယ်
    if (!phone || !name || !password || !city || !township) {
      return res.status(400).json({
        success: false,
        message:
          'ဖုန်းနံပါတ်၊ အမည်၊ လျှို့ဝှက်နံပါတ်၊ မြို့ကြီးနှင့် မြို့နယ်တို့အားလုံး ထည့်သွင်းရန် လိုအပ်ပါသည်။',
      });
    }

    // ၂။ Password အရှည်ကို စစ်ဆေးခြင်း
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'လျှို့ဝှက်နံပါတ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
      });
    }

    // ၃။ ဖုန်းနံပါတ် format ကို Regex ဖြင့် စစ်ဆေးခြင်း
    const phoneRegex = /^\+?[0-9]{9,13}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'မှန်ကန်သော ဖုန်းနံပါတ် format မဟုတ်ပါ။',
      });
    }

    // ၄။ ဖုန်းနံပါတ် အကောင့်ရှိပြီးသား ဟုတ်/မဟုတ် စစ်ဆေးခြင်း
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ဤဖုန်းနံပါတ်ဖြင့် အကောင့်ရှိပြီးဖြစ်သည်။',
      });
    }
    // ၅။ User အသစ်ဆောက်ခြင်း (Schema အသစ်အတိုင်း Default values များ ထည့်သွင်းခြင်း)
    const user = await User.create({
      phone,
      name,
      password,
      isPhoneVerified: false, // OTP စစ်ပြီးမှ true ပြောင်းရန်
      location: {
        city: city, // အပေါ်က ခွဲထုတ်ထားတဲ့ 'ရန်ကုန်' ဝင်သွားမည်
        township: township, // အပေါ်က ခွဲထုတ်ထားတဲ့ 'လှိုင်' ဝင်သွားမည်
        coordinates: {
          type: 'Point',
          coordinates: [0, 0],
        },
      },
      verificationStatus: 'unverified',
      identityVerification: {
        idType: null,
        idNumber: null,
        idFrontImageUrl: null,
        idBackImageUrl: null,
        selfieWithIdUrl: null,
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null,
      },
      bankAccount: {
        provider: null,
        accountName: null,
        accountNumber: null,
        isLinked: false,
      },
      preferredLanguage: 'my',
      trustScore: 5.0, // စတင်ချိန်တွင် trust score ကို ၅ အပြည့်ပေးထားခြင်း
      totalSales: 0,
      totalReports: 0,
      isVerified: false, // Identity KYC approved ဖြစ်မှ true ပြောင်းမည်
      role: 'user',
    });

    // ၆။ Response ပြန်လည်ပေးပို့ခြင်း
    res.status(201).json({
      success: true,
      message: 'အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ဖုန်းနံပါတ်အား စိစစ်ပေးပါ။',
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        isPhoneVerified: user.isPhoneVerified,
        verificationStatus: user.verificationStatus,
        trustScore: user.trustScore,
        preferredLanguage: user.preferredLanguage,
        token: generateToken(user), // မိမိ၏ JWT token generate လုပ်သော function
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'အကောင့်ဖွင့်ခြင်းမအောင်မြင်ပါ။',
      error: err.message,
    });
  }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'ဖုန်းနံပါတ်နှင့် လျှို့ဝှက်နံပါတ် ထည့်သွင်းရန် လိုအပ်ပါသည်။',
      });
    }
    const user = await User.findOne({ phone }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ဖုန်းနံပါတ် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။',
      });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'ဖုန်းနံပါတ် သို့မဟုတ် လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည်။',
      });
    }
    await User.updateOne(
      { _id: user._id },
      { $set: { updatedAt: new Date() } }
    );
    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        preferredLanguage: user.preferredLanguage,
        profileImageUrl: user.profileImageUrl,
        token: generateToken(user),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'ဝင်ရောက်ခြင်းမအောင်မြင်ပါ။',
    });
  }
};
export const getUserProfile = async (req, res) => {
  try {
    // URL Parameter ကနေ ID ကို ယူမယ်
    const { id } = req.params;

    // Database မှာ ID နဲ့ ရှာမယ် (password ကိုတော့ ချန်လှပ်ထားခဲ့မယ်)
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'အသုံးပြုသူ ရှာမတွေ့ပါ။',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error(err);

    // ID format မမှန်ရင် ဖြစ်တတ်တဲ့ error ကို ကိုင်တွယ်ခြင်း
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'ID ပုံစံ မှားယွင်းနေပါသည်။',
      });
    }

    res.status(500).json({
      success: false,
      message: 'အချက်အလက် ရယူခြင်း မအောင်မြင်ပါ။',
      error: err.message,
    });
  }
};

export const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res
        .status(400)
        .json({ success: false, message: 'ဖုန်းနံပါတ် လိုအပ်ပါသည်။' });
    }

    const formattedPhone = phone.startsWith('0')
      ? '959' + phone.slice(1)
      : phone;

    // --- ဤနေရာတွင် API Key နှင့် Secret ကို Base64 စနစ်သို့ ပြောင်းလဲခြင်း ---
    const apiKey = process.env.SMSPOH_API_KEY;
    const apiSecret = process.env.SMSPOH_API_SECRET;
    const base64Token = Buffer.from(`${apiKey}:${apiSecret}`).toString(
      'base64'
    );
    // -------------------------------------------------------------

    const response = await axios.post(
      'https://v3.smspoh.com/api/otp/request',
      null,
      {
        params: {
          accessToken: base64Token, // ပြောင်းလဲထားသော Token အား ထည့်သွင်းခြင်း
          to: formattedPhone,
          from: process.env.SMSPOH_SENDER_ID || 'SMSPoh',
          brand: process.env.SMSPOH_BRAND_NAME || 'SMSPoh',
          ttl: '300',
        },
      }
    );

    if (!response.data || !response.data.requestId) {
      throw new Error(
        response.data?.message || 'SMSPoh မှ Request ID မပြန်လာပါ။'
      );
    }

    await Otp.create({
      phone,
      requestId: response.data.requestId,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP ကုဒ်ကို ပို့ဆောင်ပေးပြီးပါပြီ။',
    });
  } catch (err) {
    console.error('Send OTP error:', err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: 'OTP ပို့ဆောင်ခြင်း မအောင်မြင်ပါ။',
      error: err.response?.data?.message || err.message,
    });
  }
};

// ==========================================
// 🅱️ ၂။ OTP ကုဒ်အား တိုက်စစ်ခြင်း (Verification)
// ==========================================
export const verifyOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'ဖုန်းနံပါတ်နှင့် OTP ကုဒ် ထည့်သွင်းရန် လိုအပ်ပါသည်။',
        });
    }

    // ၁။ Database ထဲတွင် အဆိုပါ ဖုန်းနံပါတ်အတွက် ကုဒ်ရှိမရှိ ရှာဖွေခြင်း
    const otpRecord = await Otp.findOne({ phone });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message:
          'OTP ကုဒ် သက်တမ်းကုန်ဆုံးသွားပြီ ဖြစ်သဖြင့် ကုဒ်အသစ် ပြန်တောင်းပေးပါ။',
      });
    }

    // ၂။ ရိုက်ထည့်လိုက်သော ကုဒ်နှင့် DB ထဲက ကုဒ် ကိုက်ညီမှု ရှိ/မရှိ စစ်ဆေးခြင်း
    if (otpRecord.code !== code) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'ရိုက်ထည့်လိုက်သော OTP ကုဒ် မမှန်ကန်ပါ။',
        });
    }

    // ၃။ ကုဒ်မှန်ကန်ပါက အသုံးပြုပြီးသား OTP အား DB ထဲမှ ချက်ချင်းဖျက်ပစ်ခြင်း
    await Otp.deleteOne({ _id: otpRecord._id });

    // ၄။ User Model ထဲတွင် ဖုန်းနံပါတ်အား စိစစ်ပြီးကြောင်း (isPhoneVerified: true) ပြောင်းလဲခြင်း
    const user = await User.findOneAndUpdate(
      { phone },
      { isPhoneVerified: true },
      { new: true }
    );

    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: 'ဤဖုန်းနံပါတ်ဖြင့် အကောင့်ဖွင့်ထားခြင်း မရှိပါ။',
        });
    }

    res.status(200).json({
      success: true,
      message: 'ဖုန်းနံပါတ် အတည်ပြုခြင်း အောင်မြင်ပါသည်။',
      data: {
        _id: user._id,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
      },
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        success: false,
        message: 'OTP စစ်ဆေးခြင်း မအောင်မြင်ပါ။',
        error: err.message,
      });
  }
};

export const verifyLiveness = async (req, res) => {
  try {
    console.log('Incoming Body:', req.body);
    console.log('Incoming File:', req.file);

    const { userId } = req.body;
    const file = req.file;

    // ၁။ ဖိုင်ပါမပါ အရင်စစ်ဆေးမည်
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'စစ်ဆေးမည့် ဖိုင် (Evidence) မပါဝင်ပါ',
      });
    }

    // ၂။ userId ပါမပါ စစ်ဆေးမည် (အကယ်၍ Form-data ထဲတွင် userId ကျန်ခဲ့ပါက)
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'အသုံးပြုသူ ID (userId) လိုအပ်ပါသည်',
      });
    }

    // ၃။ Database ထဲတွင် အဆိုပါ အသုံးပြုသူ ရှိမရှိ စစ်ဆေးမည်
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'အသုံးပြုသူ မမှန်ကန်ပါ သို့မဟုတ် မရှိပါ',
      });
    }

    // ၄။ AI စစ်ဆေးမှု ရလဒ် (Mockup)
    const mockAiResult = {
      isRealPerson: true,
      confidence: 97.4,
    };

    // ၅။ AI စစ်ဆေးမှု မအောင်မြင်ခဲ့လျှင် (Spoofing Detected)
    if (!mockAiResult.isRealPerson) {
      await LivenessLog.create({
        userId,
        status: 'FAILED',
        fileUrl: file.path, // Disk Storage ကြောင့် file.path ကို တိုက်ရိုက်သုံးနိုင်ပါပြီ
        confidenceScore: mockAiResult.confidence,
      });

      return res.status(400).json({
        success: false,
        message: 'မျက်နှာလှုပ်ရှားမှု မမှန်ကန်ပါ (Spoofing Detected)',
      });
    }

    // ၆။ စစ်ဆေးမှု အောင်မြင်ခဲ့လျှင် Database တွင် သိမ်းဆည်းမည်
    const newLog = await LivenessLog.create({
      userId,
      status: 'PASSED',
      fileUrl: file.path, // Disk Storage မှ ရရှိလာသော Local Server File Path
      confidenceScore: mockAiResult.confidence,
    });

    return res.status(200).json({
      success: true,
      message: 'Face liveness verification completed successfully!',
      data: newLog,
    });
  } catch (error) {
    console.error('Liveness Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error ဖြစ်သွားပါသည်',
    });
  }
};
