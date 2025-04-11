// Remove the cloudinary import and configuration
// Instead, we'll use direct API calls

// Upload image to Cloudinary
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', import.meta.env.VITE_CLOUDINARY_CLOUD_NAME);
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const timestamp = Math.round((new Date).getTime()/1000);
    const signature = await generateSignature(publicId, timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          signature,
          api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
          timestamp,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

// Helper function to generate signature
const generateSignature = async (publicId, timestamp) => {
  const message = `public_id=${publicId}&timestamp=${timestamp}${import.meta.env.VITE_CLOUDINARY_API_SECRET}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}; 