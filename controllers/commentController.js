import Comment from '../models/comments.js';
import BuyerProduct from '../models/buyerproduct.js';

export const addComment = async (req, res) => {
  const { productId, comment } = req.body;

  try {
    // ၁။ Comment Collection မှာ အရင်သိမ်းမယ်
    const newComment = await Comment.create({
      productId: productId,
      userId: req.user.id,
      userName: req.user.name,
      text: comment,
    });

    // ၂။ BuyerProduct Model ထဲက recentComments list ကို update လုပ်မယ်
    const updateResult = await BuyerProduct.updateOne(
      { _id: productId },
      {
        $push: {
          recentComments: {
            $each: [
              {
                userId: req.user.id,
                userName: req.user.name,
                text: comment, // ဒီမှာ text variable မရှိလို့ comment ကို သုံးရပါမယ်
                createdAt: new Date(),
              },
            ],
            $slice: -2, // နောက်ဆုံး ၂ ခုပဲ သိမ်းမယ်
          },
        },
      }
    );

    console.log('Update Result:', updateResult); // Debug လုပ်ရန်

    res.status(201).json(newComment);
  } catch (err) {
    console.error('Add Comment Error:', err);
    res.status(500).json({ error: err.message });
  }
};
