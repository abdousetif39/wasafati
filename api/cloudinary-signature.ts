import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req: any, res: any) {
  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  
  if (!hasCloudinaryConfig) {
    return res.status(500).json({ error: "Missing environment variable" });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const timestamp = Math.round((new Date).getTime() / 1000);
    const folder = req.query.folder || 'uploads';
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET!);
    
    res.status(200).json({ 
      signature, 
      timestamp, 
      cloudName: process.env.CLOUDINARY_CLOUD_NAME, 
      apiKey: process.env.CLOUDINARY_API_KEY 
    });
  } catch (e) {
    console.error('Cloudinary Signature Error:', e);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
}
