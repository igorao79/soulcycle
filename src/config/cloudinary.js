// Cloudinary configuration
export const CLOUDINARY_CLOUD_NAME = 'do9t8preg';
export const CLOUDINARY_UPLOAD_PRESET = 'postss';
export const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;
export const CLOUDINARY_API_KEY = '417482147356551';

// Cloudinary transformation presets
export const AVATARS = {
  GUEST: 'avatars/guest',
  DEFAULT: 'avatars/default',
  ADMIN: 'avatars/admin',
  MOD: 'avatars/mod',
  VIP: 'avatars/vip'
};

// Image optimization settings
export const DEFAULT_QUALITY = 'auto:good';
export const DEFAULT_FORMAT = 'auto';
export const DEFAULT_FETCH_FORMAT = 'auto';

// Transformation strings
export const AVATAR_TRANSFORMATION = 'c_fill,g_face,w_300,h_300,q_auto:good';
export const THUMBNAIL_TRANSFORMATION = 'c_fill,w_200,h_200,q_auto:good';
export const POST_IMAGE_TRANSFORMATION = 'q_auto:good,f_auto'; 