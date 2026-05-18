import BuyerProduct from '../models/buyerproduct.js';
import uploadToImgBB from '../utils/uploadToImgBB.js';

// Create Product
export const createProduct = async (req, res) => {
  try {
    const sellerId = req.user?.id;
    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // IMPORTANT:
    // isPaidPost ကို client body မှ တိုက်ရိုက်မယုံပါနဲ့။
    // payment verification flow ကနေ server-side သတ်မှတ်ထားတဲ့ flag ကိုသုံးသင့်ပါတယ်။
    // လက်ရှိအတွက် fallback only:
    const isPaidPost =
      req.body.isPaidPost === true || req.body.isPaidPost === 'true';

    // ---------- Monthly free limit check (free 2 times/month) ----------
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0
    );

    const freeUsedCount = await BuyerProduct.countDocuments({
      sellerId,
      isPaidPost: false,
      status: { $ne: 'deleted' },
      createdAt: { $gte: startOfMonth, $lt: startOfNextMonth },
    });

    if (!isPaidPost && freeUsedCount >= 2) {
      return res.status(403).json({
        success: false,
        code: 'FREE_LIMIT_REACHED',
        message:
          'ဤလအတွက် free post ၂ ခါ ပြည့်သွားပါပြီ။ ဆက်တင်ရန် payment လုပ်ပါ။',
      });
    }

    // ---------- Upload images ----------
    let imagePaths = [];
    if (req.files && req.files.length > 0) {
      imagePaths = await Promise.all(
        req.files.map(async (file) => uploadToImgBB(file))
      );
    }

    // ---------- Build safe payload ----------
    const {
      title,
      description,
      price,
      category,
      // req.body.sellerId ကို ignore
      // req.body.images ကို ignore (uploaded imagePaths only)
      // req.body.status ကို ignore (server controlled)
    } = req.body;

    const newProduct = new BuyerProduct({
      title,
      description,
      price: Number(price) || 0,
      category,
      images: imagePaths,
      sellerId,
      isPaidPost,
      status: 'active',
    });

    await newProduct.save();

    return res.status(201).json({
      success: true,
      data: newProduct,
      meta: {
        freeUsedThisMonth: isPaidPost ? freeUsedCount : freeUsedCount + 1,
        freeLimit: 2,
      },
    });
  } catch (err) {
    console.error('Create Product Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Create failed',
      error: err.message,
    });
  }
};

// Update Product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Auth middleware မှရသော ID

    // ပိုင်ရှင်ဖြစ်ကြောင်းစစ်ဆေးပြီးမှ ပြင်ခွင့်ပေးမည်
    const product = await BuyerProduct.findOneAndUpdate(
      { _id: id, sellerId: userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you are not authorized',
      });
    }

    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Soft Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Performance & Data Safety:
    // Database ထဲက အပြီးမဖျက်ဘဲ status ကို 'deleted' ပြောင်းရုံသာ လုပ်ဆောင်ပါမည်
    const product = await BuyerProduct.findOneAndUpdate(
      { _id: id, sellerId: userId },
      { $set: { status: 'deleted' } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you are not authorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted (Soft Delete) successfully',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
// Login ဝင်ထားသူ တင်ထားသော Product များအားလုံးကို ပြန်ထုတ်ပေးရန်
export const getBuyerAllPost = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Query ပတ်မယ်
    const products = await BuyerProduct.find({
      status: { $ne: 'deleted' },
    })
      .populate({
        path: 'sellerId', // BuyerProduct model ထဲက sellerId field ကို ညွှန်းမယ်
        model: 'User', // User model ထဲက data တွေကို ယူမယ်
        select: 'name phone profileImage', // User ဆီကနေ လိုချင်တဲ့ field တွေကိုပဲ project လုပ်မယ်
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // စုစုပေါင်းအရေအတွက်ကိုလည်း filter နဲ့အညီ စစ်ရပါမယ်
    const totalProducts = await BuyerProduct.countDocuments({
      status: { $ne: 'deleted' },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit),
      hasMore: skip + products.length < totalProducts,
      data: products,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

// Add Comment with Recent Comment Embedding
