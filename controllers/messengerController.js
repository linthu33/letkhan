import Message from '../models/Message.js';

// Chat History ကို ဆွဲထုတ်ယူခြင်း
export const getChatHistory = async (req, res) => {
  try {
    console.log(req.params);
    const { chatId } = req.params;
    const messages = await Message.find({ receiverId: chatId }).sort({
      timestamp: 1,
    });
    console.log('📜 Chat History:', messages);
    res.status(200).json({ message: true, data: messages });
  } catch (err) {
    res.status(500).json({ message: false, error: err.message });
  }
};
