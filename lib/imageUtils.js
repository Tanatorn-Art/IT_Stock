import fs from 'fs'
import path from 'path'

/**
 * Delete an image file from the filesystem
 * @param {string} imagePath - The public path of the image (e.g., '/images/filename.webp')
 * @returns {boolean} - True if deletion was successful or file didn't exist
 */
export function deleteImage(imagePath) {
  try {
    // Validate path to prevent directory traversal
    if (!imagePath || typeof imagePath !== 'string') {
      return false
    }

    if (!imagePath.startsWith('/images/') || imagePath.includes('..')) {
      return false
    }

    // Convert to file system path (include public directory)
    const filePath = path.join(process.cwd(), 'public', imagePath)

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      return true
    } else {
      return true // Not an error, file just doesn't exist
    }
  } catch (error) {
    console.error('Failed to delete image:', imagePath, error)
    return false
  }
}

/**
 * Check if an image file exists
 * @param {string} imagePath - The public path of the image
 * @returns {boolean} - True if file exists
 */
export function imageExists(imagePath) {
  try {
    if (!imagePath || typeof imagePath !== 'string') {
      return false
    }

    if (!imagePath.startsWith('/images/') || imagePath.includes('..')) {
      return false
    }

    const filePath = path.join(process.cwd(), 'public', imagePath)
    return fs.existsSync(filePath)
  } catch (error) {
    console.error('Error checking image existence:', error)
    return false
  }
}

/**
 * Generate a unique filename for stock images
 * @param {string} stockId - The stock item ID
 * @returns {string} - Unique filename with timestamp
 */
export function generateStockImageName(stockId) {
  const timestamp = Date.now()
  return `${stockId}-${timestamp}.webp`
}
