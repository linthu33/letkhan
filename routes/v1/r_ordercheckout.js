import express from 'express';
import {
  createOrder,
  getOrdersByShop,
  getOrderByIdUser,
} from '../../controllers/OrdercheckoutContoller.js';
import { protect } from '../../middleware/authMiddleware.js'; // middleware ကို import လုပ်ပါ

const router = express.Router();

// Middleware (protect) ကို ခံထားသည့်အတွက် createOrder ထဲမှာ req.user ကို သုံးနိုင်ခြင်းဖြစ်သည်
router.post('/createOrder', protect, createOrder);
// ဆိုင်အလိုက် Order စာရင်းကြည့်ရန် (Dashboard အတွက်)
router.get('/shop/:id', protect, getOrdersByShop);

// Order တစ်ခုချင်းစီ အသေးစိတ်ကြည့်ရန် (ID သုံးပြီး)
router.get('/:id', protect, getOrderByIdUser);
export default router;
