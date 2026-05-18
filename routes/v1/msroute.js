import express from 'express';
import { getChatHistory } from '../../controllers/messengerController.js';

const router = express.Router();

// GET: /api/messages/:chatId
router.get('/:chatId', getChatHistory);

export default router;
