import mongoose from 'mongoose';

const buyerproductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: { type: String, required: true, text: true }, // Search မြန်ဖို့ text index ထားမယ်
    description: String,
    price: { type: Number, index: true },
    images: [String],
    category: { type: String, index: true },

    // Performance: Likes နဲ့ Views ကို array ထဲမှာ user id တွေအကုန်မသိမ်းဘဲ counter နဲ့သိမ်းပါ
    likesCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },

    // Performance: နောက်ဆုံး comment ၂ ခုလောက်ကို embedding လုပ်ထားရင် Feed ပြတဲ့အခါ Query တစ်ခါပဲလိုမယ်
    recentComments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        userName: String,
        text: String,
        createdAt: Date,
      },
    ],

    status: {
      type: String,
      enum: ['active', 'sold', 'deleted'],
      default: 'active',
      index: true,
    },
    isPaidPost: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Indexing: ဈေးနှုန်းနဲ့ အချိန်ပေါ်မူတည်ပြီး filter လုပ်တာ မြန်စေဖို့
buyerproductSchema.index({ createdAt: -1 });

const BuyerProduct = mongoose.model('BuyerProduct', buyerproductSchema);
export default BuyerProduct;
