import mongoose from 'mongoose';

const shopInfoSchema = new mongoose.Schema(
  {
    // ဆိုင်ရဲ့ သီးသန့် ID (ဥပမာ - SHOP-123)
    shop_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ဆိုင်အမည်
    shop_name: {
      type: String,
      required: true,
      trim: true,
    },

    // ဆိုင်ပိုင်ရှင် သို့မဟုတ် တာဝန်ခံ (User Schema နှင့် ချိတ်ဆက်ခြင်း)
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // သင်အရင်ရေးထားတဲ့ User Model အမည် ဖြစ်ရပါမယ်
      required: true,
    },

    // ဆိုင်ခွဲ (ဥပမာ - ရန်ကုန်ခွဲ၊ မန္တလေးခွဲ)
    branch: {
      type: String,
      default: 'Main',
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    // တည်နေရာ အသေးစိတ်
    shop_location: {
      city: {
        type: String,
        required: true,
      },
      address_detail: {
        type: String,
        required: true,
      },
    },
    shopPhone: {
      type: String,
      required: true,
    },
    // ဆိုင်ဖွင့်ထားခြင်း ရှိ/မရှိ (Status)
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    // createdAt နှင့် updatedAt ကို အလိုအလျောက် ထည့်ပေးသည်
    timestamps: true,
  }
);

const ShopInfo = mongoose.model('ShopInfo', shopInfoSchema);

export default ShopInfo;
