/**
 * Utility script for cleaning up Cloudinary resources
 * 
 * This script can be run to find and optionally delete orphaned Cloudinary images
 * that are no longer referenced in the database.
 * 
 * Usage:
 * 1. Import this in a component or page where you have admin rights
 * 2. Call the runCleanup function with desired options
 */

import imageService from './imageService';

/**
 * Run a cleanup operation on Cloudinary resources
 * 
 * @param {Object} options - Cleanup options
 * @param {boolean} options.dryRun - If true, only report orphaned images without deleting (default: true)
 * @param {number} options.maxResources - Maximum number of resources to check (default: 500)
 * @param {string} options.folder - Cloudinary folder to check (default: 'posts')
 * @returns {Promise<Object>} - Cleanup results
 */
export async function runCleanup(options = {}) {
  const {
    dryRun = true,
    maxResources = 500,
    folder = 'posts'
  } = options;
  
  console.log(`Starting Cloudinary cleanup with options:`, {
    dryRun,
    maxResources,
    folder
  });
  
  try {
    // Call the cleanup function from imageService
    const result = await imageService.cleanupOrphanedImages({
      dryRun,
      maxResources,
      folder
    });
    
    console.log(`Cleanup ${dryRun ? '(DRY RUN) ' : ''}completed`);
    console.log(`Found ${result.summary.orphanedResourcesCount} orphaned resources out of ${result.summary.totalCloudinaryResources} total`);
    
    if (result.orphanedResources?.length > 0) {
      console.log('Orphaned resources:');
      result.orphanedResources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.public_id} (${formatBytes(resource.size_bytes)})`);
      });
      
      if (!dryRun) {
        console.log(`Deleted ${result.orphanedResources.length} orphaned resources`);
      }
    } else {
      console.log('No orphaned resources found.');
    }
    
    return result;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}

/**
 * Helper function to format byte size to human-readable format
 * 
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} - Formatted size string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Create a report of the current Cloudinary usage
 * 
 * @param {string} folder - Folder to report on (default: 'posts')
 * @returns {Promise<Object>} - Usage report
 */
export async function generateUsageReport(folder = 'posts') {
  try {
    console.log(`Generating usage report for folder: ${folder}`);
    
    // Run cleanup in dry-run mode to get resource data
    const result = await imageService.cleanupOrphanedImages({
      dryRun: true,
      maxResources: 1000,
      folder
    });
    
    const totalResources = result.summary.totalCloudinaryResources;
    const orphanedResources = result.summary.orphanedResourcesCount;
    const usedResources = totalResources - orphanedResources;
    
    // Calculate total size
    let totalSize = 0;
    let orphanedSize = 0;
    
    if (result.orphanedResources) {
      result.orphanedResources.forEach(resource => {
        totalSize += resource.size_bytes;
        orphanedSize += resource.size_bytes;
      });
    }
    
    const report = {
      folder,
      totalResources,
      usedResources,
      orphanedResources,
      totalSize: formatBytes(totalSize),
      orphanedSize: formatBytes(orphanedSize),
      potentialSavings: formatBytes(orphanedSize),
      orphanedPercentage: totalResources > 0 ? (orphanedResources / totalResources * 100).toFixed(1) + '%' : '0%'
    };
    
    console.log(`===== CLOUDINARY USAGE REPORT =====`);
    console.log(`Folder: ${report.folder}`);
    console.log(`Total resources: ${report.totalResources}`);
    console.log(`Used resources: ${report.usedResources}`);
    console.log(`Orphaned resources: ${report.orphanedResources} (${report.orphanedPercentage})`);
    console.log(`Orphaned size: ${report.orphanedSize}`);
    console.log(`Potential savings: ${report.potentialSavings}`);
    console.log(`====================================`);
    
    return report;
  } catch (error) {
    console.error('Error generating usage report:', error);
    throw error;
  }
}

// Default export for convenience
export default {
  runCleanup,
  generateUsageReport
}; 