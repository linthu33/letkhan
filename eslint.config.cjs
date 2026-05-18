const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        // Jest variables တွေကို အားလုံး သိအောင် ဖွင့်ပေးထားပါတယ် (5 errors ရှင်းဖို့)
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly"
      }
    },
    rules: {
      // 💡 Git commit/test ကာလမှာ console code တွေကို လုံးဝ ignore လုပ်ခိုင်းလိုက်တာပါ (44 warnings ရှင်းဖို့)
      "no-console": "off", 
      "no-unused-vars": "error"
    }
  }
];