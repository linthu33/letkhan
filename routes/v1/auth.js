import express from 'express';
import {
  register,
  login,
  getUserProfile,
} from '../../controllers/authController.js';

const router = express.Router();

// routes
router.post('/register', register);
router.post('/login', login);
router.get('/:id', getUserProfile);

export default router;
