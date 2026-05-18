import mongoose from 'mongoose';

const ListingFreeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    ownerType: {
      type: String,
      enum: ['user', 'shop'],
      default: 'user',
      index: true,
    },

    quota: {
      freeLimit: { type: Number, default: 4 },
      shopFreeLimit: { type: Number, default: 20 },
      used: { type: Number, default: 0 },
      remaining: { type: Number, default: 4 },
    },

    period: {
      type: {
        type: String,
        enum: ['monthly'],
        default: 'monthly',
      },
      currentPeriod: {
        type: String,
        index: true,
      },
      resetAt: Date,
    },

    history: [
      {
        listingId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Listing',
          required: true,
          index: true,
        },

        type: {
          type: String,
          enum: ['free', 'paid'],
          required: true,
        },

        usedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// ✅ EXPORT (IMPORTANT)
export default mongoose.model('ListingFree', ListingFreeSchema);
