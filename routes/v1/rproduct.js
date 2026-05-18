import express from 'express';

import {
  getProductFilter,
  getProductById,
  getALLProducts,
  getALLProductsSearch,
  getProductsBySeller,
  createProduct,
  updateProduct,
  deleteProduct,
  togglePromote,
  incrementViews,
  getAllCategories,
} from '../../controllers/productController.js';

import { protect } from '../../middleware/authMiddleware.js';
import upload from '../../config/multer.js';

const router = express.Router();

// ==================== ROUTES ====================

// 🔓 Public
router.get('/', getProductFilter);
router.get('/all', getALLProducts);
router.get('/allcategories', getAllCategories);
router.get('/search', getALLProductsSearch);

// ⚠️ IMPORTANT: put /seller BEFORE /:id
router.get('/seller/:sellerId', getProductsBySeller);

router.get('/:id', getProductById);

// 🔐 Protected
router.post('/create', protect, upload.array('images', 5), createProduct);

router.put('/:id', protect, updateProduct);

router.delete('/:id', protect, deleteProduct);

router.patch('/:id/promote', protect, togglePromote);

router.patch('/:id/views', incrementViews); // public OK

export default router;
