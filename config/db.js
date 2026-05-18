const mongoose = require('mongoose');

const connectDB = async () => {
  // ၁။ Environment Variables ကနေ အချက်အလက်တွေ ယူမယ်
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  try {
    const username = encodeURIComponent(process.env.DB_USER); // ဒီနေရာမှာ username အမှန်ကို ထည့်ပါ
    const password = encodeURIComponent(process.env.DB_PASSWORD); // ဒီနေရာမှာ password အမှန်ကို ထည့်ပါ
    const cluster = 'cluster0.fb14r.mongodb.net';
    const dbName = 'hotelbooking';

    // ၂။ Connection String ကို Format ပြန်လုပ်မယ်
    const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbName}?retryWrites=true&w=majority`;

    // ၃။ Mongoose နဲ့ ချိတ်ဆက်မယ်
    const conn = await mongoose.connect(uri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Error တက်ရင် App ကို ရပ်လိုက်မယ်
    process.exit(1);
  }
};

module.exports = connectDB;
