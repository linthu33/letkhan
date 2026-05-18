import mongoose from 'mongoose';

// Child တွေအတွက် သီးသန့် schema တစ်ခု အရင်ဆောက်ပါ
const childSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, sparse: true },
  description: { type: String },
});

// ပြီးမှ ၎င်းကို children field ထဲမှာ ပြန်သုံးပါ
// ဒါပေမဲ့ ဒါက ၁ ဆင့်ပဲ (1-level deep) သွားမှာပါ။
// အဆင့်ဆင့် (Recursive) သွားချင်ရင် နည်းလမ်း (၁) ကိုပဲ သုံးရပါမယ်။
const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String, default: '📦' },
    colorHex: {
      type: String,
      default: '#E5E7EB',
      match: /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, // #RGB or #RRGGBB
    },
    slug: { type: String, unique: true, sparse: true }, // Root level အတွက်
    children: [childSchema],
  },
  { timestamps: true }
);

const Category = mongoose.model('Category', categorySchema);
export default Category;
