/* import multer from 'multer';
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
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ပုံသိမ်းမည့် folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
// ၂။ Multer instance ထဲမှာ fileFilter ကို ပါးပါးလေး ထည့်ပေးလိုက်ပါတယ်
// သုံးမထားတဲ့ storage variable ကို ဖယ်ထုတ်ပြီး memoryStorage ကို တိုက်ရိုက်ထည့်ထားပါတယ်
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: fileFilter, // <--- ဒီမှာ ပြန်သုံးပေးလိုက်လို့ Error ပျောက်သွားပါပြီ
});

// ✅ ESM EXPORT
export default upload;
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// ဥပမာ- uploads/ folder မရှိသေးရင် အလိုအလျောက် ဆောက်ပေးမည့် ကုဒ်
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ၁။ Disk Storage စနစ်ကို သေချာ သတ်မှတ်ခြင်း
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // ဖိုင်ကို uploads/ folder ထဲမှာ သွားသိမ်းမည်
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // ရလာမည့်ပုံစံ- face_evidence-1715234234.jpg
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

function fileFilter(req, file, cb) {
  const allowedExtensions = /jpeg|jpg|png|gif|heic|webp/;
  const extName = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (extName) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
}

// ၂။ အရေးကြီး - storage နေရာတွင် memoryStorage အစား အပေါ်က storage ကို ပြန်ထည့်ပါ
const upload = multer({
  storage: storage, // 👈 memoryStorage() မဟုတ်ရပါ!!!
  fileFilter: fileFilter,
});

export default upload;
