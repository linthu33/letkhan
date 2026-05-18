import express from 'express';

import {
  createProduct,
  getProductsByShop,
  getProductById,
} from '../../controllers/shopproductController.js';

import { protect } from '../../middleware/authMiddleware.js';
import upload from '../../config/multer.js';

const router = express.Router();

// ==================== ROUTES ====================

// 🔓 Public

// 🔐 Protected
// POST: /api/products
router.post('/create', protect, upload.array('images'), createProduct);

// GET: /api/products/shop/:shopId
router.get('/shopall/:shopId', getProductsByShop);

// GET: /api/products/:id
router.get('/:id', getProductById);

export default router;
