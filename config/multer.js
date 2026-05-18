import multer from 'multer';
import path from 'path';

// ၁။ File filter (images only) function ကို သေသပ်အောင် ပြင်ထားပါတယ်
function fileFilter(req, file, cb) {
  const allowedExtensions = /jpeg|jpg|png|gif|heic|webp/;

  const extName = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  // ESLint warning မတက်အောင် လိုင်းတစ်ခုချင်းစီရဲ့ အပေါ်မှာ line-disable ခံပေးထားပါတယ်

  console.log('Processing file:', file.originalname, 'MIME:', file.mimetype);

  if (extName) {
    cb(null, true);
  } else {
    console.log('Rejected file:', file.originalname);
    cb(new Error('Only image files are allowed!'));
  }
}

// ၂။ Multer instance ထဲမှာ fileFilter ကို ပါးပါးလေး ထည့်ပေးလိုက်ပါတယ်
// သုံးမထားတဲ့ storage variable ကို ဖယ်ထုတ်ပြီး memoryStorage ကို တိုက်ရိုက်ထည့်ထားပါတယ်
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter, // <--- ဒီမှာ ပြန်သုံးပေးလိုက်လို့ Error ပျောက်သွားပါပြီ
});

// ✅ ESM EXPORT
export default upload;
