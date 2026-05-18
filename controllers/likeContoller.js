import Like from '../models/likemodel.js';
import BuyerProduct from '../models/buyerproduct.js';

// Toggle Like
export const toggleLike = async (req, res) => {
  const { productId } = req.params;
  // Middleware ကနေလာတဲ့ req.user.id ကို ယူပါမယ်
  const userId = req.user.id;

  console.log(`User ${userId} toggled like on product ${productId}`);

  try {
    // ၁။ Like collection မှာ productId ရော userId ပါ တူညီတဲ့ record ရှိလား ရှာမယ်
    const existingLike = await Like.findOne({ productId, userId });

    if (existingLike) {
      // Like ရှိပြီးသားဆိုရင် (Unlike လုပ်မယ်)
      await Like.deleteOne({ _id: existingLike._id });

      // Product model မှာ likesCount ကို ၁ လျှော့မယ်
      await BuyerProduct.findByIdAndUpdate(productId, {
        $inc: { likesCount: -1 },
      });

      return res.status(200).json({
        success: true,
        liked: false,
        message: 'Like removed successfully',
      });
    } else {
      // Like မရှိသေးရင် (Like လုပ်မယ်)
      // productId နဲ့ userId နှစ်ခုလုံး သိမ်းထားမှ ဘယ်သူ like လုပ်လဲ သိမှာပါ
      await Like.create({ productId, userId });

      // Product model မှာ likesCount ကို ၁ တိုးမယ်
      await BuyerProduct.findByIdAndUpdate(productId, {
        $inc: { likesCount: 1 },
      });

      return res.status(200).json({
        success: true,
        liked: true,
        message: 'Product liked successfully',
      });
    }
  } catch (err) {
    console.error('Error in toggleLike:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// View Count Increment
export const viewProduct = async (req, res) => {
  try {
    await BuyerProduct.updateOne(
      { _id: req.params.id },
      { $inc: { viewsCount: 1 } }
    );
    res.status(200).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
