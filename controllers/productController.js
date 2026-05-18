import Product from '../models/Product.js';
import User from '../models/User.js';
import ListingFree from '../models/ListingFree.js';

import uploadToImgBB from '../utils/uploadToImgBB.js';

// ==================== Helper function for building filters ====================
const buildProductFilters = (queryParams) => {
  const filters = { isActive: true }; // only show active products by default

  // Category filter
  if (queryParams.category) {
    filters.category = queryParams.category;
  }
  if (queryParams.subCategory) {
    filters.subCategory = queryParams.subCategory;
  }

  // Price range
  if (queryParams.minPrice || queryParams.maxPrice) {
    filters.price = {};
    if (queryParams.minPrice) filters.price.$gte = Number(queryParams.minPrice);
    if (queryParams.maxPrice) filters.price.$lte = Number(queryParams.maxPrice);
  }

  // Condition
  if (queryParams.condition) {
    filters.condition = queryParams.condition;
  }

  // Location (city or township)
  if (queryParams.city) {
    filters['location.city'] = queryParams.city;
  }
  if (queryParams.township) {
    filters['location.township'] = queryParams.township;
  }

  // Negotiable
  if (queryParams.negotiable === 'true') {
    filters.negotiable = true;
  }

  // Search by text (title + description)
  if (queryParams.search) {
    filters.$text = { $search: queryParams.search };
  }

  // Only promoted products
  if (queryParams.promoted === 'true') {
    filters.isPromoted = true;
    filters.promotedUntil = { $gt: new Date() };
  }

  // Seller specific
  if (queryParams.sellerId) {
    filters.sellerId = queryParams.sellerId;
  }

  return filters;
};

export const createProduct = async (req, res) => {
  try {
    // ================= SAFE PARSE =================
    console.log(
      'Raw location data:',
      req.body.condition,
      req.body.location || 'No location provided'
    );
    console.log(req.body.shoptype);
    const safeParse = (v, fallback = null) => {
      if (!v) return fallback;
      try {
        return JSON.parse(v);
      } catch {
        return fallback;
      }
    };

    const safeParseArray = (v, fallback = []) => {
      if (!v) return fallback;
      try {
        const parsed = JSON.parse(v);
        return Array.isArray(parsed) ? parsed : fallback;
      } catch {
        return fallback;
      }
    };

    // ================= FIELDS =================
    const { sellerId, title, category, subCategory } = req.body;

    const price = Number(req.body.price);

    if (
      !sellerId ||
      !title ||
      !category ||
      !subCategory ||
      !price ||
      price <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Required fields missing or invalid price',
      });
    }

    // ================= USER CHECK =================
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found',
      });
    }

    // ================= QUOTA =================
    const currentPeriod = new Date().toISOString().slice(0, 7);
    const limit = 4;

    let quotaDoc = await ListingFree.findOne({
      ownerId: sellerId,
      'period.currentPeriod': currentPeriod,
    });

    if (!quotaDoc) {
      quotaDoc = await ListingFree.create({
        ownerId: sellerId,
        ownerType: 'user',
        quota: { freeLimit: limit, used: 0, remaining: limit },
        period: {
          type: 'monthly',
          currentPeriod,
          resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        history: [],
      });
    }

    if (quotaDoc.quota.used >= limit) {
      return res.status(403).json({
        success: false,
        message: '၄ မျိုးပဲတင်ခွင့်ရှိသည်။ နောက်လထပ်တင်နိုင်ပါမည်။',
        limit: limit,
      });
    }

    // ================= FILES =================
    const imageFiles = req.files || [];

    if (!imageFiles.length) {
      return res.status(400).json({
        success: false,
        message: 'ဓတ်ပုံတစ်ခုထက်မနည်းတင်ရန်လိုအပ်သည်',
      });
    }

    // ================= UPLOAD =================
    const imageUrls = await Promise.all(
      imageFiles.map((file) => uploadToImgBB(file))
    );

    // ================= LOCATION (SAFE) =================
    let location = safeParse(req.body.location);

    if (
      !location ||
      !location.city ||
      !location.township ||
      !location.coordinates ||
      !Array.isArray(location.coordinates.coordinates)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid location data',
      });
    }

    // ================= CREATE PRODUCT =================
    const product = await Product.create({
      sellerId,
      title,
      description: req.body.description || '',
      category,
      subCategory,
      price,
      negotiable: true,
      quantity: Number(req.body.quantity || 1),
      condition: req.body.condition || '',
      phoneNumber: req.body.phoneNumber || '',
      images: imageUrls,
      location,
      attributes: safeParseArray(req.body.attributes, []),
      deliveryOptions: safeParseArray(req.body.deliveryOptions, ['pickup']),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      shoptype: req.body.shoptype,
      isActive: true,
    });

    // ================= UPDATE QUOTA =================
    quotaDoc.quota.used += 1;
    quotaDoc.quota.remaining = limit - quotaDoc.quota.used;

    quotaDoc.history.push({
      listingId: product._id,
      type: 'free',
      usedAt: new Date(),
    });

    await quotaDoc.save();

    return res.status(201).json({
      success: true,
      data: product,
      quota: quotaDoc,
    });
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err);

    return res.status(500).json({
      success: false,
      message: 'Create failed',
      error: err.message,
    });
  }
};

// ==================== Get products with filters, pagination, sorting ====================
export const getProductFilter = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;
    console.log('Query params:', req.query);
    const filters = buildProductFilters(req.query);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If using text search, we must use $meta score for sorting
    let query = Product.find(filters);
    if (req.query.search) {
      query = Product.find(filters, { score: { $meta: 'textScore' } });
      query.sort({ score: { $meta: 'textScore' } });
    } else {
      query.sort(sortOptions);
    }

    const products = await query
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sellerId', 'name phone trustScore profileImageUrl')
      .lean();

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ပစ္စည်းများရယူရန်အမှား',
      error: error.message,
    });
  }
};
export const getALLProducts = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);

    const skip = (page - 1) * limit;

    // ================= QUERY =================
    /*     const products = await Product.find({
  isActive: true,
  createdAt: { $gte: today }
}) */
    const query = Product.find({ isActive: true })
      .sort({ createdAt: -1 }) // ✅ latest first
      .skip(skip)
      .limit(limit)
      .populate('sellerId', 'name phone trustScore profileImageUrl')
      .lean();

    const products = await query;

    const total = await Product.countDocuments({ isActive: true });

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET PRODUCTS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'ပစ္စည်းများရယူရန်အမှား',
      error: error.message,
    });
  }
};

export const getALLProductsSearch = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      q, // search keyword
      category,
      minPrice,
      maxPrice,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    // ================= BUILD FILTER =================
    const filter = { isActive: true };

    // 🔍 Text search (name, description)
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    // 🏷 Category filter
    if (category) {
      filter.category = category;
    }

    // 💲 Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // ================= QUERY =================
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sellerId', 'name phone trustScore profileImageUrl')
      .lean();

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      filter: filter,
    });
  } catch (error) {
    console.error('GET PRODUCTS ERROR:', error);

    return res.status(500).json({
      success: false,
      message: 'ပစ္စည်းများရယူရာတွင် အမှားဖြစ်နေသည်',
      error: error.message,
    });
  }
};
// ==================== Get single product by ID (increment view count) ====================
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count atomically
    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('sellerId', 'name phone trustScore profileImageUrl location');

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'ပစ္စည်းမတွေ့ပါ' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ပစ္စည်းအသေးစိတ်ရယူရန်အမှား',
      error: error.message,
    });
  }
};

// ==================== Update product ====================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user?._id || updates.userId; // assuming auth middleware

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'ပစ္စည်းမတွေ့ပါ' });
    }

    // Only seller can update
    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'သင်သည် ဤပစ္စည်းကိုပြင်ဆင်ခွင့်မရှိပါ',
      });
    }

    // Prevent updating certain fields directly
    delete updates._id;
    delete updates.sellerId;
    delete updates.createdAt;
    delete updates.views;

    updates.updatedAt = Date.now();

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ပစ္စည်းပြင်ဆင်ရန်အမှား',
      error: error.message,
    });
  }
};

// ==================== Soft delete product (set isActive = false) ====================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.body.userId;

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'ပစ္စည်းမတွေ့ပါ' });
    }

    if (product.sellerId.toString() !== userId) {
      return res
        .status(403)
        .json({ success: false, message: 'သင်သည် ဤပစ္စည်းကိုဖျက်ခွင့်မရှိပါ' });
    }

    product.isActive = false;
    product.updatedAt = Date.now();
    await product.save();

    res
      .status(200)
      .json({ success: true, message: 'ပစ္စည်းကိုဖျက်လိုက်ပါပြီ' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ပစ္စည်းဖျက်ရန်အမှား',
      error: error.message,
    });
  }
};

// ==================== Toggle promote (paid promotion) ====================
export const togglePromote = async (req, res) => {
  try {
    const { id } = req.params;
    const { durationDays = 7 } = req.body; // promote for 7 days by default
    const userId = req.user?._id || req.body.userId;

    const product = await Product.findById(id);
    if (!product)
      return res
        .status(404)
        .json({ success: false, message: 'ပစ္စည်းမတွေ့ပါ' });

    if (product.sellerId.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'ခွင့်မပြုပါ' });
    }

    if (product.isPromoted) {
      // Turn off promotion
      product.isPromoted = false;
      product.promotedUntil = null;
    } else {
      // Turn on promotion
      product.isPromoted = true;
      const until = new Date();
      until.setDate(until.getDate() + durationDays);
      product.promotedUntil = until;
    }

    product.updatedAt = Date.now();
    await product.save();

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ပရိုမိုးရှင်းပြောင်းရန်အမှား',
      error: error.message,
    });
  }
};

// ==================== Get products by seller ====================
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { page = 1, limit = 20, activeOnly = 'true' } = req.query;

    const filters = { sellerId };
    if (activeOnly === 'true') filters.isActive = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const products = await Product.find(filters)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ရောင်းသူ၏ပစ္စည်းများရယူရန်အမှား',
      error: error.message,
    });
  }
};

// ==================== Increment view count manually (if needed) ====================
export const incrementViews = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: 'ပစ္စည်းမတွေ့ပါ' });
    }
    res.status(200).json({ success: true, views: product.views });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'ကြည့်ရှုမှုတိုးရန်အမှား',
      error: error.message,
    });
  }
};

// GET /api/categories/all
export const getAllCategories = async (req, res) => {
  try {
    // Fetch only category + subCategory fields
    const products = await Product.find({}, { category: 1, subCategory: 1 });

    const categories = new Set();
    const subCategories = new Set();

    products.forEach((item) => {
      if (item.category) categories.add(item.category);
      if (item.subCategory) subCategories.add(item.subCategory);
    });

    return res.status(200).json({
      success: true,
      categoriesList: Array.from(categories),
      subCategoriesList: Array.from(subCategories),
    });
  } catch (err) {
    console.error('Category Fetch Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading categories',
    });
  }
};
