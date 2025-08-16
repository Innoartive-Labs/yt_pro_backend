const cloudinary = require('cloudinary').v2;

// Check if Cloudinary credentials are available
const hasCloudinaryCredentials = () => {
  return process.env.CLOUDINARY_CLOUD_NAME && 
         process.env.CLOUDINARY_API_KEY && 
         process.env.CLOUDINARY_API_SECRET;
};

// Configure Cloudinary
if (hasCloudinaryCredentials()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else if (process.env.CLOUDINARY_URL) {
  // Parse Cloudinary URL if provided
  try {
    const url = new URL(process.env.CLOUDINARY_URL);
    cloudinary.config({
      cloud_name: url.hostname.split('.')[0],
      api_key: url.username,
      api_secret: url.password
    });
  } catch (error) {
    console.warn('Invalid CLOUDINARY_URL format:', error.message);
  }
} else {
  console.warn('Cloudinary credentials not found. Image uploads will be disabled.');
}

// Upload image to Cloudinary
const uploadImage = async (file, folder = 'general') => {
  // Check if Cloudinary is configured
  if (!hasCloudinaryCredentials() && !process.env.CLOUDINARY_URL) {
    return {
      success: false,
      error: 'Cloudinary is not configured. Please set up Cloudinary credentials.'
    };
  }

  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload multiple images
const uploadMultipleImages = async (files, folder = 'general') => {
  const uploadPromises = files.map(file => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  // Check if Cloudinary is configured
  if (!hasCloudinaryCredentials() && !process.env.CLOUDINARY_URL) {
    return {
      success: false,
      error: 'Cloudinary is not configured. Please set up Cloudinary credentials.'
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: true,
      result: result
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get image URL with transformations
const getImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, transformations);
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageUrl
};
