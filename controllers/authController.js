import User from '../models/User.js';
import jwt from 'jsonwebtoken';

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
    const {
      phone,
      name,
      password,
      city,
      township,
      preferredLanguage = 'my',
    } = req.body;

    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message:
          'ဖုန်းနံပါတ်၊ အမည်နှင့် လျှို့ဝှက်နံပါတ် ထည့်သွင်းရန် လိုအပ်ပါသည်။',
      });
    }
    // 2. Password အရှည်ကို စစ်မယ် (အသစ်ထည့်လိုက်တဲ့အပိုင်း)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'လျှို့ဝှက်နံပါတ်သည် အနည်းဆုံး ၆ လုံး ရှိရပါမည်။',
      });
    }
    const existingUser = await User.findOne({ phone });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ဤဖုန်းနံပါတ်ဖြင့် အကောင့်ရှိပြီးဖြစ်သည်။',
      });
    }

    const user = await User.create({
      phone,
      name,
      password,
      location: {
        city: city || 'ရန်ကုန်',
        township: township || '',
        coordinates: [0, 0],
      },
      preferredLanguage,
      trustScore: 0,
      totalSales: 0,
      totalReports: 0,
      isVerified: false,
      role: 'user',
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        trustScore: user.trustScore,
        preferredLanguage: user.preferredLanguage,
        token: generateToken(user),
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
