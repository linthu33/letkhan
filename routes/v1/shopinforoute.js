import express from 'express';
import {
  createShop,
  getMyShopsAll,
  getShopById,
  updateShop,
  deleteShop,
} from '../../controllers/shopinfoController.js'; // Controller ကို import လုပ်ခြင်း
import { protect } from '../../middleware/authMiddleware.js'; // ပေးထားတဲ့ function name အတိုင်းသုံးထားပါတယ်
import upload from '../../config/multer.js';

const router = express.Router();

router.post('/create', protect, upload.array('images', 5), createShop);
router.get('/allshops', getMyShopsAll);
router.get('/:id', protect, getShopById);
router.put('/:id', protect, upload.array('images', 5), updateShop);
router.delete('/:id', protect, deleteShop);

export default router;
