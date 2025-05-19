// Cloudinary configuration for image optimization with advanced parameters
export const CLOUDINARY_URL = 'https://res.cloudinary.com/do9t8preg/image/fetch/f_auto,q_auto:best,dpr_auto,w_auto,c_limit,w_800/';

// Global cache for optimized URLs to prevent duplicate transformations
export const optimizedUrlCache = new Map();

// Function to optimize image URLs through Cloudinary
export const optimizeImageUrl = (url) => {
  if (!url) return null;
  
  // Return cached URL if available
  if (optimizedUrlCache.has(url)) {
    return optimizedUrlCache.get(url);
  }
  
  // Skip already optimized URLs
  if (url.includes('cloudinary.com')) {
    optimizedUrlCache.set(url, url);
    return url;
  }
  
  try {
    // Encode URL and wrap in Cloudinary
    const optimizedUrl = `${CLOUDINARY_URL}${encodeURIComponent(url)}`;
    optimizedUrlCache.set(url, optimizedUrl);
    return optimizedUrl;
  } catch (error) {
    console.error('Error optimizing image URL:', error);
    return url; // Return original URL on error
  }
};

// Available font options
export const FONT_OPTIONS = [
  { name: 'По умолчанию', value: 'inherit' },
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Source Sans Pro', value: "'Source Sans Pro', sans-serif" },
  { name: 'Ubuntu', value: "'Ubuntu', sans-serif" },
  { name: 'Raleway', value: "'Raleway', sans-serif" },
  { name: 'Nunito', value: "'Nunito', sans-serif" }
];

// Helper function to determine if a color is dark/black
export const isDarkColor = (hexColor) => {
  // Handle null or undefined
  if (!hexColor) return false;
  
  // Convert hex to RGB
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - dark colors have low luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is dark (luminance < 0.5)
  return luminance < 0.5;
}; 