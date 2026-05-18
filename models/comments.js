import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      index: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    profileImage: String,
    text: { type: String, required: true },
  },
  { timestamps: true }
);

const Comments = mongoose.model('Comments', commentSchema);
export default Comments;
