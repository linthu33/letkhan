import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Route Imports
import authRoutes from './routes/v1/auth.js';
import productRoutes from './routes/v1/rproduct.js';
import categoryRoutes from './routes/v1/r_category.js';
import MessageRoute from './routes/v1/msroute.js';
import BuyerRoute from './routes/v1/buyerroute.js';
import ShopRoute from './routes/v1/r_shopproduct.js';
import ShopInfoRoute from './routes/v1/shopinforoute.js';
import CheckOut from './routes/v1/r_ordercheckout.js';

// အရေးကြီးသည်- Message Model ကို Import လုပ်ပါ
import Message from './models/Message.js';

dotenv.config();

const app = express();
const httpServer = createServer(app); // HTTP server ဆောက်ခြင်း
const VALID_API_KEY = process.env.LETKHAN_API_KEY;
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
//console.log(process.env.MONGO_URI);
// MongoDB connect
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/msecondDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));
// API Key စစ်ဆေးမည့် Middleware
const apiKeyAuth = (req, res, next) => {
  // Header ထဲမှ 'x-api-key' ကို ဖတ်ခြင်း
  const userApiKey = req.headers['x-api-key'];

  if (!userApiKey) {
    return res
      .status(401)
      .json({ error: 'API Key မပါဝင်ပါသဖြင့် ခွင့်မပြုပါ (Unauthorized)' });
  }

  if (userApiKey !== VALID_API_KEY) {
    return res
      .status(403)
      .json({ error: 'မှားယွင်းသော API Key ဖြစ်ပါသည် (Forbidden)' });
  }

  // API Key မှန်ကန်ပါက နောက်တစ်ဆင့်သို့ ပေးသွားမည်
  next();
};
// Routes
app.use('/api/auth', apiKeyAuth, authRoutes);
app.use('/api/products', apiKeyAuth, productRoutes);
app.use('/api/categories', apiKeyAuth, categoryRoutes);
app.use('/api/messages', apiKeyAuth, MessageRoute);
app.use('/api/buyer', apiKeyAuth, BuyerRoute);
app.use('/api/shop', apiKeyAuth, ShopRoute);
app.use('/api/shopinfo', apiKeyAuth, ShopInfoRoute);
app.use('/api/checkout', apiKeyAuth, CheckOut);
app.get('/', apiKeyAuth, (req, res) => res.send('API is running...'));

// Socket.io Logic
io.on('connection', (socket) => {
  console.log('👤 User Connected:', socket.id);

  socket.on('join_room', (chatId) => {
    socket.join(chatId);
    console.log(`🏠 Joined Room: ${chatId}`);
  });

  socket.on('send_message', async (data) => {
    console.log('📨 Message Received:', data);
    try {
      // Database ထဲ သိမ်းခြင်း
      const newMessage = new Message({
        chatId: data.chatId,
        senderId: data.senderId,
        receiverId: data.receiverId,
        message: data.message,
      });

      const savedMessage = await newMessage.save();
      console.log('💾 Saved to DB:', savedMessage);

      // Room ထဲရှိ လူများထံ စာပြန်ပို့ခြင်း
      io.to(data.chatId).emit('receive_message', savedMessage);
    } catch (e) {
      console.error('❌ Socket Error:', e.message);
    }
  });

  socket.on('disconnect', () => console.log('👋 User Disconnected'));
});

const PORT = process.env.PORT || 5000;

// အရေးကြီးသည်- app.listen အစား httpServer.listen ကို သုံးပါ
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
