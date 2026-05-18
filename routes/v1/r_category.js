import express from 'express';

import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  shopcreateCategory,
  getAllShopCategories,
} from '../../controllers/categoryContoller.js';

const router = express.Router();

router.post('/', createCategory);
router.get('/', getAllCategories);
//shop
router.post('/shopcatcreate', shopcreateCategory);
router.get('/shopcatall', getAllShopCategories);

//sell
router.get('/:id', getCategoryById);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
