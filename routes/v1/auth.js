import express from 'express';
import {
  register,
  login,
  getUserProfile,
  sendOTP,
  verifyOTP,
  verifyLiveness,
} from '../../controllers/authController.js';

import upload from '../../config/multer.js';
const router = express.Router();

// routes
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/verify', upload.single('face_evidence'), verifyLiveness);
router.get('/:id', getUserProfile);

export default router;
