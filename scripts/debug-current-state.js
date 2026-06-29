import { getDatabase } from '../lib/database.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Debug current image state
async function debugCurrentState() {
  const db = getDatabase();
  const imageDir = join(process.cwd(), 'data', 'image');

  console.log('Debugging current image state...');
  console.log('================================');

  // Check current database state
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images in database: ${stockWithImages.length}`);
  
  stockWithImages.forEach(item => {
    console.log(`  ID: ${item.id}, Name: ${item.name}, Image: "${item.image}"`);
  });

  // Check actual files
  try {
    const files = await readdir(imageDir);
    console.log(`\nFiles in ${imageDir}: ${files.length}`);
    files.forEach(file => {
      console.log(`  - ${file}`);
    });

    // Test if the existing image can be accessed via the expected URL format
    if (files.length > 0) {
      const testFile = files[0];
      const expectedUrl = `/images/${testFile}`;
      console.log(`\nExpected URL for ${testFile}: ${expectedUrl}`);
      console.log('This URL should work through Next.js routing: /images/* -> /api/images/*');
    }
  } catch (error) {
    console.log(`Error reading image directory: ${error.message}`);
  }

  // Check if there are any items that should have images but don't
  const allStock = db.prepare("SELECT id, name, image FROM stock").all();
  const itemsWithoutImages = allStock.filter(item => !item.image || item.image.length === 0);
  console.log(`\nItems without images: ${itemsWithoutImages.length}`);
  itemsWithoutImages.forEach(item => {
    console.log(`  ID: ${item.id}, Name: ${item.name}`);
  });
}

// Run the function
debugCurrentState().catch(console.error);
