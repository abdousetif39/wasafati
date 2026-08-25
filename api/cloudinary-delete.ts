import { v2 as cloudinary } from 'cloudinary';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
     return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  
  if (!hasCloudinaryConfig) {
    return res.status(500).json({ error: 'Cloudinary server configuration is incomplete' });
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  try {
    const { publicId } = req.body || {};
    if (!publicId) return res.status(400).json({ error: 'Missing publicId' });
    
    const result = await cloudinary.uploader.destroy(publicId);
    res.status(200).json(result);
  } catch (e) {
    console.error('Cloudinary Delete Error:', e);
    res.status(500).json({ error: 'Failed to delete image' });
  }
}
