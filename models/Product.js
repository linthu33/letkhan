import mongoose from 'mongoose';

const attributeSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array'],
      required: true,
    },
    unit: { type: String, default: null },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    category: {
      type: String,
      required: true,
      enum: [
        'ဖုန်း',
        'ကွန်ပျူတာ',
        'အိမ်သုံး',
        'ဖက်ရှင်',
        'စာအုပ်စာပေ',
        'ထွန်စက်ပစ္စည်း',
        'Suprise gift',
        'အဝတ်အထည်',
        'အိမ်ဆောက်ပစ္စည်း',
        'ကားယာဉ်',
        'အခြား',
      ],
    },

    subCategory: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    negotiable: {
      type: Boolean,
      default: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    condition: {
      type: String,
      enum: ['အသစ်', 'အသုံးပြုပြီး', 'ပြန်လည်ပြုပြင်ထား'],
      required: true,
    },

    images: [
      {
        type: String,
        required: true,
      },
    ],

    videoUrl: {
      type: String,
      default: null,
    },
    shoptype: {
      type: String,
      required: true,
      enum: ['အရောင်း', 'အဝယ်', 'ဈေးဆိုင်', 'အခြား'],
    },
    location: {
      city: { type: String, required: true, trim: true },
      township: { type: String, required: true, trim: true },

      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          //required: true,
          validate: {
            validator: function (v) {
              return Array.isArray(v) && v.length === 2;
            },
            message: 'Coordinates must be [longitude, latitude]',
          },
        },
      },
    },

    deliveryOptions: [
      {
        type: String,
        enum: ['pickup', 'delivery'],
        default: 'pickup',
      },
    ],

    deliveryFee: {
      type: Number,
      default: 0,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    attributes: [attributeSchema],

    views: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isPromoted: {
      type: Boolean,
      default: false,
    },

    promotedUntil: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// ================= INDEXES =================
productSchema.index({ sellerId: 1 });
productSchema.index({ category: 1, subCategory: 1, shoptype: 1 });
productSchema.index({ price: 1 });
productSchema.index({ 'location.coordinates': '2dsphere' });
productSchema.index({ createdAt: -1 });
productSchema.index({ isActive: 1, expiresAt: 1 });
productSchema.index({ title: 'text', description: 'text' });
productSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
productSchema.pre('save', function (next) {
  if (this.location?.coordinates?.coordinates) {
    const [a, b] = this.location.coordinates.coordinates;

    // enforce [lng, lat]
    this.location.coordinates.coordinates = [Number(a), Number(b)];
  }
  next();
});
// sellerId + title ကို "ဈေးဆိုင်" မှာပဲ unique
productSchema.index(
  { sellerId: 1, title: 1 },
  {
    unique: true,
    partialFilterExpression: { shoptype: 'ဈေးဆိုင်' },
    collation: { locale: 'en', strength: 2 }, // case-insensitive (A == a)
  }
);
// ✅ CORRECT EXPORT
export default mongoose.model('Product', productSchema);
