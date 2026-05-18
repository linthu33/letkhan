import Order from '../models/OrdercheckoutModel.js';
import ShopProduct from '../models/shopproduct.js';

export const createOrder = async (req, res) => {
  try {
    // ၁။ userId ကို auth middleware က သတ်မှတ်ပေးထားသော req.user._id မှ ယူခြင်း
    const userId = req.user._id;

    const {
      sellerId,
      items,
      shippingAddress,
      paymentDetails,
      pricing,
      noteToSeller,
    } = req.body;

    // ၂။ Validation စစ်ဆေးခြင်း
    if (!items?.length) {
      return res.status(400).json({
        success: false,
        message: 'Order items စာရင်း မတွေ့ရှိပါ။',
      });
    }

    // ၃။ Order Object ကို Database ထဲ သိမ်းဆည်းခြင်း
    const order = await Order.create({
      userId, // Auth middleware မှ ရလာသော ID
      sellerId,
      items,
      shippingAddress,
      paymentDetails,
      pricing,
      noteToSeller,
    });

    // ၄။ Stock အရေအတွက်ကို Update လုပ်ခြင်း
    // အမှားအယွင်းမရှိစေရန် map လုပ်ပြီး promise အားလုံးပြီးမှ ရှေ့ဆက်ပါမည်
    const stockUpdates = items.map((item) =>
      ShopProduct.findByIdAndUpdate(item.id, {
        $inc: { stockQuantity: -item.quantity },
      })
    );
    await Promise.all(stockUpdates);

    res.status(201).json({
      success: true,
      message: 'Order တင်ခြင်း အောင်မြင်ပါသည်။',
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error ဖြစ်ပွားခဲ့ပါသည်။',
      error: error.message,
    });
  }
};
/**
 * @desc    Get all orders for a specific seller
 * @route   GET /api/orders/shop
 * @access  Private (Seller Only)
 */
export const getOrdersByShop = async (req, res) => {
  try {
    // Auth middleware ကနေ seller ရဲ့ ID ကို ယူပါတယ်
    // (မှတ်ချက် - Seller သည်လည်း User တစ်ယောက်ဖြစ်သောကြောင့် req.user._id ကို သုံးနိုင်သည်)

    const sellerId = req.params.id;

    const orders = await Order.find({ sellerId })
      .populate('userId', 'name phone email') // ဝယ်သူရဲ့ အချက်အလက်ပါဆွဲထုတ်ခြင်း
      .sort({ createdAt: -1 }); // နောက်ဆုံးမှာတဲ့ Order ကို အပေါ်ဆုံးကပြခြင်း

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Orders စာရင်းရယူစဉ် Error ဖြစ်ပွားခဲ့ပါသည်။',
      error: error.message,
    });
  }
};
/**
 * @desc    Get single order details by ID
 * @route   GET /api/orders/:id
 * @access  Private (Buyer or Seller)
 */
export const getOrderByIdUser = async (req, res) => {
  try {
    const { id } = req.params;

    // find() က Array ပြန်ပေးမှာပါ
    const orders = await Order.find({ userId: id })
      .populate('userId', 'name phone email image')
      .populate('sellerId', 'name phone');

    // Mongoose find() က data မရှိရင် [] (Array အလွတ်) ပြန်လို့ length နဲ့ စစ်ရပါမယ်
    if (!orders || orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'မည်သည့် Order မျှ ရှာမတွေ့ပါ။',
      });
    }

    // Array ထဲက Order တိုင်းကို လက်ရှိ user က ကြည့်ခွင့်ရှိလား စစ်ဆေးခြင်း
    const hasPermission = orders.every((order) => {
      const isBuyer = order.userId?._id?.toString() === req.user._id.toString();
      const isSeller =
        order.sellerId?._id?.toString() === req.user._id.toString();
      return isBuyer || isSeller;
    });

    if (!hasPermission) {
      return res
        .status(403)
        .json({ success: false, message: 'ကြည့်ရှုခွင့်မရှိပါ' });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
