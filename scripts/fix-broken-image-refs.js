import { getDatabase } from '../lib/database.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Fix broken image references in database
async function fixBrokenImageRefs() {
  const db = getDatabase();
  const imageDir = 'C:\\Users\\armmi\\Documents\\GitHub\\IT-Stock\\data\\image';

  console.log('Fixing broken image references...');
  console.log('================================');

  // Get all stock items with images
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Found ${stockWithImages.length} items with images in database`);

  // Get all actual files in image directory
  let actualFiles = [];
  try {
    actualFiles = await readdir(imageDir);
    console.log(`Found ${actualFiles.length} files in image directory: ${actualFiles.join(', ')}`);
  } catch (error) {
    console.log(`Error reading image directory: ${error.message}`);
    return;
  }

  let fixedCount = 0;
  let removedCount = 0;

  for (const item of stockWithImages) {
    const imagePath = item.image; // e.g., "/images/upload-1778051303628.webp"
    const filename = imagePath.split('/').pop(); // Extract filename
    const fullPath = join(imageDir, filename);
    
    try {
      const fileStat = await stat(fullPath);
      console.log(`✓ ID: ${item.id}, Name: ${item.name} - File exists: ${filename}`);
    } catch (error) {
      console.log(`✗ ID: ${item.id}, Name: ${item.name} - MISSING: ${filename}`);
      
      // Option 1: Remove the image reference (set to empty string)
      // This is safer than trying to reuse another image
      db.prepare("UPDATE stock SET image = '' WHERE id = ?").run(item.id);
      console.log(`  → Removed broken image reference for ${item.name}`);
      removedCount++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Total items with images: ${stockWithImages.length}`);
  console.log(`  Broken references removed: ${removedCount}`);
  console.log(`  Items now without images: ${removedCount}`);
  console.log(`  Items with valid images: ${stockWithImages.length - removedCount}`);

  // Verify the fix
  console.log('\nVerifying fix...');
  const updatedStock = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images after fix: ${updatedStock.length}`);
  
  updatedStock.forEach(item => {
    console.log(`  ✓ ID: ${item.id}, Name: ${item.name}, Image: ${item.image}`);
  });
}

// Run the function
fixBrokenImageRefs().catch(console.error);
