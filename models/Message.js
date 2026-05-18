import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: { type: String, required: true },
  receiverId: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
});

const Message = mongoose.model('Message', messageSchema);
export default Message;
