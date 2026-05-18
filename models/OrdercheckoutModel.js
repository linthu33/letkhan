import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    // ၁။ မှာယူသူနှင့် ရောင်းချသူ (References)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // ရောင်းသူသည်လည်း User model ထဲကပင် ဖြစ်လျှင်
      required: true,
    },

    // ၂။ ပစ္စည်းစာရင်း (Array of Objects)
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: String,
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity cannot be less than 1.'],
        },
        priceAtPurchase: {
          type: Number,
          required: true, // ဝယ်စဉ်က ဈေးနှုန်းကို သိမ်းရန်
        },
        totalPrice: Number,
      },
    ],

    // ၃။ ပို့ဆောင်မည့် လိပ်စာ
    shippingAddress: {
      receiverName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      fullAddress: { type: String, required: true },
      city: { type: String, required: true },
    },

    // ၄။ ငွေပေးချေမှု အချက်အလက်
    paymentDetails: {
      method: {
        type: String,
        enum: ['kpay', 'wave', 'cod', 'card'],
        required: true,
      },
      accountName: String,
      transactionId: String,
      isVerified: {
        type: Boolean,
        default: false,
      },
    },

    // ၅။ ဈေးနှုန်း အနှစ်ချုပ်
    pricing: {
      subTotal: { type: Number, required: true },
      deliveryFee: { type: Number, default: 0 },
      totalAmount: { type: Number, required: true },
    },

    // ၆။ မှာယူမှု အခြေအနေ
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },

    // ၇။ အပိုဆောင်း Field များ
    noteToSeller: String,
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true, // createdAt နှင့် updatedAt ကို အလိုအလျောက် ထည့်ပေးသည်
  }
);

// Order Number ကို မသိမ်းခင် အလိုအလျောက် ထုတ်ပေးရန် (Middleware)
orderSchema.pre('validate', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

const Orders = mongoose.model('Orders', orderSchema);
export default Orders;
