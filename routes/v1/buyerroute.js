import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import {
  createProduct,
  getBuyerAllPost,
} from '../../controllers/buyerContoller.js';
import { toggleLike, viewProduct } from '../../controllers/likeContoller.js';
import { addComment } from '../../controllers/commentController.js';
import upload from '../../config/multer.js';
const router = express.Router();

// Core Routes
router.post('/create', protect, upload.array('images', 3), createProduct);

// Interaction Routes

router.get('/buyerpost', getBuyerAllPost);
router.post('/comment/:productId', protect, addComment);

router.patch('/togglelike/:productId', protect, toggleLike); //like post ကို get method နဲ့ လုပ်ထားတာက အရင်က toggle like ကို post method နဲ့လုပ်ထားတာကို ပြင်ချင်လို့ပါ။ ဒါပေမယ့် အဲဒီ route ကို အခုတော့ view count တីတឲနည နည နည နည နည နည နည နည နည နည နည နည နည နည နည နည နည နည နည နည ɴယစဉ
router.patch('/viewpost/:productId', viewProduct);

export default router;
