import { getDatabase } from '../lib/database.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Check if actual image files exist in data/image directory
async function checkFileExistence() {
  const db = getDatabase();
  const imageDir = join(process.cwd(), 'data', 'image');

  console.log('Checking image file existence...');
  console.log('================================');

  // Get all stock items with images
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();

  console.log(`Found ${stockWithImages.length} items with images in database`);

  // Check if image directory exists
  try {
    const dirStat = await stat(imageDir);
    console.log(`Image directory exists: ${imageDir}`);
  } catch (error) {
    console.log(`Image directory does NOT exist: ${imageDir}`);
    console.log('This is likely the issue - the directory needs to be created');
    return;
  }

  // List all files in the image directory
  try {
    const files = await readdir(imageDir);
    console.log(`\nFiles in ${imageDir}:`);
    if (files.length === 0) {
      console.log('  No files found - directory is empty');
    } else {
      files.forEach(file => {
        console.log(`  - ${file}`);
      });
    }
  } catch (error) {
    console.log(`Error reading image directory: ${error.message}`);
  }

  // Check each database image against actual files
  console.log('\nChecking database images against actual files:');
  console.log('===============================================');

  let missingCount = 0;
  for (const item of stockWithImages) {
    const imagePath = item.image; // e.g., "/images/upload-1778051303628.webp"
    let filename = imagePath.split('/').pop(); // Extract filename
    if (filename.includes('filename=')) {
      filename = filename.split('filename=').pop();
    }
    const fullPath = join(imageDir, filename);

    try {
      const fileStat = await stat(fullPath);
      console.log(` ID: ${item.id}, Name: ${item.name} - File exists: ${filename}`);
    } catch (error) {
      console.log(` ID: ${item.id}, Name: ${item.name} - MISSING: ${filename}`);
      missingCount++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Total items with images: ${stockWithImages.length}`);
  console.log(`  Missing image files: ${missingCount}`);
  console.log(`  Images that should exist: ${stockWithImages.length - missingCount}`);
}

// Run the function
checkFileExistence().catch(console.error);
