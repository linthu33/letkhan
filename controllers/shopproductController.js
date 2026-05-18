import ShopProduct from '../models/shopproduct.js';
import uploadToImgBB from '../utils/uploadToImgBB.js';

// ကုန်ပစ္စည်းအသစ်တင်ရန်
export const createProduct = async (req, res) => {
  try {
    // Debug လုပ်ရန် req.body ကို အရင်ကြည့်ပါ
    console.log('Body Data:', req.body);
    // console.log("Files Data:", req.files);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: 'ဓာတ်ပုံတင်ရန် လိုအပ်ပါသည်။' });
    }

    // ၁။ ပုံတင်ခြင်း (ImgBB သို့)
    let imagePaths = [];
    const uploadPromises = req.files.map((file) => uploadToImgBB(file));
    imagePaths = await Promise.all(uploadPromises);
    imagePaths = imagePaths.filter((path) => path);

    // ၂။ Data ပြင်ဆင်ခြင်း
    // req.body ကလာတဲ့ String တွေကို သက်ဆိုင်ရာ Type ပြောင်းခြင်း
    const rawData = req.body;

    const productData = {
      title: rawData.title,
      description: rawData.description,
      category: rawData.category,
      subCategory: rawData.subCategory,
      price: Number(rawData.price) || 0, // String to Number
      stockQuantity: Number(rawData.stockQuantity) || 0,
      condition: rawData.condition,
      shopType: rawData.shopType,
      negotiable: rawData.negotiable === 'true', // String to Boolean
      phoneNumber: rawData.phoneNumber,
      shopInfoId: rawData.shopInfoId,
      sellerId: '69dcb0d127b100a5e9d9b499',
      images: imagePaths,
      attributes: [],
    };

    // attributes parsing
    if (rawData.attributes) {
      try {
        productData.attributes =
          typeof rawData.attributes === 'string'
            ? JSON.parse(rawData.attributes)
            : rawData.attributes;
      } catch (e) {
        console.warn('Attributes parse error:', e);
      }
    }

    // ၃။ Save to DB
    const newProduct = new ShopProduct(productData);
    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product တင်ခြင်း အောင်မြင်ပါသည်။',
      data: savedProduct,
    });
  } catch (error) {
    console.error('Create Product Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error: ' + error.message });
  }
};

// ဆိုင်အလိုက် Product များအားလုံးကို ဆွဲထုတ်ရန်
// ဆိုင်အလိုက် Product များအားလုံးကို (Pagination ဖြင့်) ဆွဲထုတ်ရန်
export const getProductsByShop = async (req, res) => {
  console.log('Fetching products for shopId:', req.params.shopId);

  const { shopId } = req.params;

  // Pagination အတွက် query params များ (Default value များသတ်မှတ်ထားခြင်း)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    // ၁။ စုစုပေါင်း Product အရေအတွက်ကို အရင်ရှာပါ
    const totalProducts = await ShopProduct.countDocuments({
      shopInfoId: shopId,
    });

    // ၂။ သတ်မှတ်ထားသော limit အလိုက် data ဆွဲထုတ်ပါ
    const products = await ShopProduct.find({ shopInfoId: shopId })
      .populate('shopInfoId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // သင်အလိုရှိသော response format အတိုင်းပြန်ပေးခြင်း
    return res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts, // စုစုပေါင်း Product အရေအတွက်
      currentPage: page,
      totalPages: Math.ceil(totalProducts / limit), // စုစုပေါင်း ရှိနိုင်သော စာမျက်နှာအရေအတွက်
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Product တစ်ခုချင်းစီ၏ အသေးစိတ်ကို ကြည့်ရန်
export const getProductById = async (req, res) => {
  try {
    const product = await ShopProduct.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
