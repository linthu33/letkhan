import fs from 'fs';
import axios from 'axios';

/* const uploadToImgBB = async (file) => {
  try {
    const image = fs.readFileSync(file.path, { encoding: "base64" });

    const res = await axios.post(
      `https://api.imgbb.com/1/upload`,
      new URLSearchParams({
        key: process.env.IMGBB_API_KEY,
        image: image,
      })
    );

    fs.unlinkSync(file.path);

    return res.data.data.url;
  } catch (error) {
    console.error("ImgBB Upload Error:", error.response?.data || error.message);
    throw new Error("Image upload failed");
  }
};
 */
/*  const uploadToImgBB = async (file) => {
  try {
    const formData = new FormData();

    // Convert buffer → base64
    formData.append("image", file.buffer.toString("base64"));

    const res = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      formData,
      { headers: formData.getHeaders() }
    );

    return res.data.data.url;
  } catch (error) {
    console.error("ImgBB Upload Error:", error.response?.data || error.message);
    throw new Error("Image upload failed");
  }
};
 */
const uploadToImgBB = async (file) => {
  try {
    const base64 = file.buffer
      ? file.buffer.toString('base64')
      : fs.readFileSync(file.path, { encoding: 'base64' });

    const res = await axios.post(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      new URLSearchParams({
        image: base64,
      })
    );

    return res.data.data.url;
  } catch (error) {
    console.error('ImgBB ERROR:', error.response?.data || error.message);
    //throw new Error('Image upload failed');
  }
};

export default uploadToImgBB;
