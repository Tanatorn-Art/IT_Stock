import { getDatabase } from '../lib/database.js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Fix the final image path issues
async function fixFinalIssues() {
  const db = getDatabase();
  const imageDir = join(process.cwd(), 'data', 'image');

  console.log('Fixing final image path issues...');
  console.log('==================================');

  // Get current items with images
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images: ${stockWithImages.length}`);

  // Get actual files
  const files = await readdir(imageDir);
  console.log(`Actual files: ${files.join(', ')}`);

  let fixedCount = 0;

  for (const item of stockWithImages) {
    const currentPath = item.image;
    console.log(`\nProcessing: ID ${item.id}, Name: ${item.name}`);
    console.log(`  Current path: "${currentPath}"`);

    // Fix IT-004: Change /data/image/ to /images/
    if (currentPath.startsWith('/data/image/')) {
      const filename = currentPath.split('/').pop();
      const correctPath = `/images/${filename}`;
      
      console.log(`  → Fixing path: ${currentPath} -> ${correctPath}`);
      db.prepare("UPDATE stock SET image = ? WHERE id = ?").run(correctPath, item.id);
      fixedCount++;
    }
    // Check if file exists for items with /images/ paths
    else if (currentPath.startsWith('/images/')) {
      const filename = currentPath.split('/').pop();
      const fullPath = join(imageDir, filename);
      
      try {
        await stat(fullPath);
        console.log(`  ✓ File exists: ${filename}`);
      } catch (error) {
        console.log(`  ✗ File missing: ${filename} - removing reference`);
        db.prepare("UPDATE stock SET image = '' WHERE id = ?").run(item.id);
        fixedCount++;
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Items processed: ${stockWithImages.length}`);
  console.log(`  Issues fixed: ${fixedCount}`);

  // Verify final state
  console.log('\nFinal verification:');
  const finalStock = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with valid images: ${finalStock.length}`);
  
  finalStock.forEach(item => {
    console.log(`  ✓ ID: ${item.id}, Name: ${item.name}, Image: ${item.image}`);
  });
}

// Run the function
fixFinalIssues().catch(console.error);
