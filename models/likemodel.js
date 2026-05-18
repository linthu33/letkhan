import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

// တစ်ယောက်တည်းက တစ်ခါပဲ like ပေးလို့ရအောင်
likeSchema.index({ productId: 1, userId: 1 }, { unique: true });

const Likes = mongoose.model('Likes', likeSchema);
export default Likes;
