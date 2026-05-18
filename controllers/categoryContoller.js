import Category from '../models/Category.js';
import shopCategory from '../models/shopcategory.js';

// 1. Create - Category သို့မဟုတ် Brand အသစ်ထည့်ခြင်း
// သင်ပေးထားတဲ့ JSON structure အတိုင်း တစ်ခါတည်း ပစ်ထည့်လို့ရပါတယ်
export const createCategory = async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    const savedData = await newCategory.save();
    res.status(201).json({ success: true, data: savedData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Read - Category အားလုံးကို ယူခြင်း
// children array တွေအကုန်လုံး တစ်ခါတည်း ပါလာပါလိမ့်မယ်
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Read - ID တစ်ခုတည်းကို ရှာခြင်း
export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'ရှာမတွေ့ပါ' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update - ပြင်ဆင်ခြင်း
export const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Body ထဲကပါတဲ့ data အကုန် update လုပ်မယ်
      { new: true, runValidators: true }
    );

    if (!updatedCategory)
      return res.status(404).json({ message: 'ရှာမတွေ့ပါ' });
    res.status(200).json(updatedCategory);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Delete - ဖျက်သိမ်းခြင်း
export const deleteCategory = async (req, res) => {
  try {
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    if (!deletedCategory)
      return res.status(404).json({ message: 'ရှာမတွေ့ပါ' });
    res.status(200).json({ message: 'ဖျက်သိမ်းမှု အောင်မြင်ပါသည်' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//Shop category
export const shopcreateCategory = async (req, res) => {
  try {
    const newCategory = new shopCategory(req.body);
    const savedData = await newCategory.save();
    res.status(201).json({ success: true, data: savedData });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
export const getAllShopCategories = async (req, res) => {
  try {
    const categories = await shopCategory.find({});
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
