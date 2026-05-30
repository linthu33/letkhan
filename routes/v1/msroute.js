import express from 'express';
import {
  getChatHistory,
  getUnreadCount,
  markAsRead,
  getMsgenChatHistory,
  getChatList,
} from '../../controllers/messengerController.js';

const router = express.Router();

// GET: /api/messages/:chatId
router.get('/unread-count/:userId', getUnreadCount);
router.put('/mark-as-read', markAsRead);
router.get('/:chatId', getChatHistory);
router.get('/history/:senderId/:receiverId', getMsgenChatHistory);
router.get('/chatlist/:userId', getChatList);

export default router;
