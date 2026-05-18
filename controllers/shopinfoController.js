import Shop from '../models/shopInfo.js';
import uploadToImgBB from '../utils/uploadToImgBB.js';

export const createShop = async (req, res) => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // 1. Data Validation (Input မပါလာရင် Crash မဖြစ်အောင် စစ်ဆေးခြင်း)
    const { shop_id, shop_name, city, address_detail } = req.body;
    if (!shop_id || !shop_name || !city || !address_detail) {
      return res.status(400).json({
        success: false,
        message: 'လိုအပ်သော အချက်အလက်များ ပြည့်စုံစွာ ဖြည့်ပေးပါ။',
      });
    }

    // 2. ဆိုင်အရေအတွက် ကန့်သတ်ချက်
    const existingShopCount = await Shop.countDocuments({ owner_id: ownerId });
    if (existingShopCount >= 3) {
      return res.status(403).json({
        success: false,
        message: 'ဆိုင်ဖွင့်ခွင့် အရေအတွက် (၃) ဆိုင် ကျော်လွန်နေပါပြီ။',
      });
    }

    // 3. ပုံများကို ImgBB သို့ တင်ခြင်း (Error Handling ပိုကောင်းအောင် လုပ်ထားသည်)
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      try {
        // တစ်ပုံချင်းစီကို error handling လုပ်ပြီး တင်ပေးခြင်း
        const uploadPromises = req.files.map((file) => uploadToImgBB(file));
        //imagePaths ="https://i.ibb.co/rRPDhwsS/0fa1f9f0e839.jpg" //await Promise.all(uploadPromises);
        imagePaths = await Promise.all(uploadPromises);
        // null ဖြစ်နေတဲ့ ပုံတွေကို ဖယ်ထုတ်ခြင်း
        imagePaths = imagePaths.filter(
          (path) => path !== null && path !== undefined
        );
      } catch (uploadError) {
        console.error('Image Upload Error:', uploadError);
        return res.status(502).json({
          success: false,
          message: 'ပုံတင်ရာတွင် အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့ပါသည်။',
        });
      }
    }

    if (imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ဆိုင်အတွက် ပုံအနည်းဆုံး တစ်ပုံ တင်ပေးရန် လိုအပ်ပါသည်။',
      });
    }

    // 4. Database သို့ သိမ်းဆည်းခြင်း
    const newShop = new Shop({
      shop_id,
      shop_name,
      owner_id: ownerId,
      branch: req.body.branch || 'Main',
      images: imagePaths,
      shop_location: {
        city,
        address_detail,
      },
      is_active: true,
    });

    const savedShop = await newShop.save();

    return res.status(201).json({
      success: true,
      data: [savedShop],
    });
  } catch (err) {
    // 5. Global Error Handler (Server Crash မဖြစ်အောင် နောက်ဆုံးက ကာကွယ်ခြင်း)
    console.error('Critical Server Error:', err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'ဤ Shop ID သည် အသုံးပြုပြီးသား ဖြစ်နေပါသည်။',
      });
    }

    // မမျှော်လင့်ထားသော error များအတွက်
    return res.status(500).json({
      success: false,
      message:
        'Server တွင် အမှားတစ်ခု ဖြစ်ပေါ်နေသဖြင့် ခေတ္တစောင့်ဆိုင်းပေးပါ။',
    });
  }
};
// 1. GET ALL SHOPS (User ပိုင်ဆိုင်သော ဆိုင်အားလုံးကို ကြည့်ရန်)
export const getMyShopsAll = async (req, res) => {
  try {
    // 1. Query Parameters မှ page နှင့် limit ကို ယူခြင်း (Default: page 1, limit 10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // 2. ဆိုင်အားလုံး၏ အရေအတွက်ကို အရင်တွက်ခြင်း (Pagination Metadata အတွက်)
    const totalShops = await Shop.countDocuments({});

    // 3. Data ကို သတ်မှတ်ထားသော ပမာဏအတိုင်း ခွဲယူခြင်း
    const shops = await Shop.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 4. Response ပြန်ခြင်း
    return res.status(200).json({
      success: true,
      count: shops.length,
      total: totalShops, // စုစုပေါင်း ဆိုင်အရေအတွက်
      currentPage: page,
      totalPages: Math.ceil(totalShops / limit), // စုစုပေါင်း ရှိနိုင်သော စာမျက်နှာအရေအတွက်
      data: shops,
    });
  } catch (err) {
    console.error('Pagination Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Data ဆွဲယူရာတွင် အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့ပါသည်။',
      error: err.message,
    });
  }
};

// 2. GET SINGLE SHOP BY ID (ဆိုင်တစ်ဆိုင်ချင်းစီ၏ အချက်အလက်ကို ကြည့်ရန်)
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findOne({
      _id: req.params.id,
      owner_id: req.user.id,
    });

    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: 'ဆိုင် ရှာမတွေ့ပါ။' });
    }

    return res.status(200).json({
      success: true,
      data: [shop], // Flutter ဘက်က Model consistency အတွက် Array နဲ့ပဲ ပြန်ပေးတာ ပိုအဆင်ပြေပါတယ်
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 3. UPDATE SHOP (ဆိုင်အချက်အလက် ပြင်ဆင်ရန်)
export const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user?.id;

    // ဆိုင်ရှိမရှိ စစ်ဆေးခြင်း
    let shop = await Shop.findOne({ _id: id, owner_id: ownerId });
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: 'ပြင်ဆင်ရန် ဆိုင်ရှာမတွေ့ပါ။' });
    }

    // ပုံအသစ်ပါလာရင် ImgBB တင်မယ်၊ မပါရင် အဟောင်းပဲ သုံးမယ်
    let imagePaths = shop.images;
    if (req.files && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file) => uploadToImgBB(file))
      );
      imagePaths = [...imagePaths, ...newImages]; // ပုံအသစ်ရော အဟောင်းရော ပေါင်းသိမ်းချင်လျှင်
    }

    const { shop_name, branch, city, address_detail, is_active } = req.body;

    // Update လုပ်ခြင်း
    const updatedShop = await Shop.findByIdAndUpdate(
      id,
      {
        shop_name: shop_name || shop.shop_name,
        branch: branch || shop.branch,
        images: imagePaths,
        shop_location: {
          city: city || shop.shop_location.city,
          address_detail: address_detail || shop.shop_location.address_detail,
        },
        is_active: is_active !== undefined ? is_active : shop.is_active,
      },
      { new: true } // Update ဖြစ်ပြီးသား data ကို ပြန်ထုတ်ပေးရန်
    );

    return res.status(200).json({
      success: true,
      data: [updatedShop],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 4. DELETE SHOP (ဆိုင်ဖျက်သိမ်းရန်)
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findOneAndDelete({
      _id: req.params.id,
      owner_id: req.user.id,
    });

    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: 'ဖျက်ရန် ဆိုင်ရှာမတွေ့ပါ။' });
    }

    return res.status(200).json({
      success: true,
      message: 'ဆိုင်ကို အောင်မြင်စွာ ဖျက်သိမ်းပြီးပါပြီ။',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
