import mongoose from 'mongoose';

const shopproductSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shopInfoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShopInfo',
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: 'MMK' },
    stockQuantity: { type: Number, default: 1 },
    condition: { type: String, default: 'အသစ်' },
    images: [String],
    phoneNumber: { type: String, required: true },
    stats: {
      views: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

const ShopProduct = mongoose.model('ShopProduct', shopproductSchema);
export default ShopProduct;
