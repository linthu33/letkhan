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

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });
    console.log(unreadCount);
    return res.status(200).json({
      success: true,
      unreadCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server အတွင်း အမှားအယွင်းရှိနေပါသည်',
      error: error.message,
    });
  }
};

// @desc    မက်ဆေ့ခ်ျများအားလုံးကို ဖတ်ပြီးသားအဖြစ် သတ်မှတ်ရန်
// @route   PUT /api/messages/mark-as-read
export const markAsRead = async (req, res) => {
  try {
    const { chatId, userId } = req.body;

    await Message.updateMany(
      { chatId: chatId, receiverId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return res.status(200).json({
      success: true,
      message: 'မက်ဆေ့ခ်ျများအားလုံး ဖတ်ပြီးသားအဖြစ် ပြောင်းလဲပြီးပါပြီ',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'အမှားအယွင်းရှိနေပါသည်',
      error: error.message,
    });
  }
};
export const getMsgenChatHistory = async (req, res) => {
  try {
    // req.query သို့မဟုတ် req.params ကနေ ရယူနိုင်သည် (ဒီနေရာတွင် Params အဖြစ် သုံးထားပါသည်)
    // senderId = လက်ရှိအသုံးပြုသူ ID ၊ receiverId = စကားလှမ်းပြောနေသည့် တစ်ဖက်လူ ID
    const { senderId, receiverId } = req.params;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        error: 'senderId နှင့် receiverId နှစ်ခုလုံး လိုအပ်ပါသည်',
      });
    }

    // 💡 A ကနေ B ဆီပို့တာဖြစ်ဖြစ်၊ B ကနေ A ဆီ ပို့တာဖြစ်ဖြစ် အကုန်ရှာမည်
    const messages = await Message.find({
      $or: [
        { senderId: senderId, receiverId: receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    }).sort({ timestamp: 1 }); // စာတိုများကို အချိန်အစဉ်လိုက် စီပေးခြင်း

    console.log(
      `📜 Chat History between ${senderId} and ${receiverId}:`,
      messages.length,
      'messages found'
    );

    // Flutter ဘက်က ဖတ်ရလွယ်အောင် success: true နှင့် data: messages ပုံစံဖြင့် ပြန်ပေးခြင်း
    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getChatList = async (req, res) => {
  try {
    const { userId } = req.params;

    // ၁။ မိမိ ပါဝင်နေတဲ့ Chat Room / Message အားလုံးကို ရှာမယ်
    // MongoDB Aggregation သုံးပြီး Chat Room တစ်ခုချင်းစီရဲ့ နောက်ဆုံးစာကို ယူတာက ပိုကောင်းပါတယ်
    const chatList = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { timestamp: -1 }, // နောက်ဆုံး ပို့တဲ့စာတွေကို အပေါ်တင်မယ်
      },
      {
        $group: {
          _id: '$chatId', // Chat Room ID အလိုက် စုမယ်
          lastMessage: { $first: '$message' },
          senderId: { $first: '$senderId' },
          receiverId: { $first: '$receiverId' },
          timestamp: { $first: '$timestamp' },
        },
      },
      // ၂။ User Collection နှင့် ချိတ်ဆက်ပြီး (Populate) နာမည်ဆွဲထုတ်ခြင်း
      // မှတ်ချက်- သင့် database model အပေါ်မူတည်ပြီး user id ကို lookup လုပ်ရပါမယ်
      {
        $lookup: {
          from: 'users', // သင့် User Collection နာမည်
          let: {
            searchId: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId',
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$searchId' }] },
              },
            },
          ],
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
    ]);

    return res.status(200).json({
      success: true,
      data: chatList, // ဒီထဲမှာ msg ကော user name ကော တွဲပါသွားပါပြီ
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
