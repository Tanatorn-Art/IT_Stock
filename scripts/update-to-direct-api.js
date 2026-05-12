import { getDatabase } from '../lib/database.js';

// Update image paths to use direct API route format
async function updateToDirectApi() {
  const db = getDatabase();

  console.log('Updating image paths to direct API format...');
  console.log('==========================================');

  // Get all items with images
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images: ${stockWithImages.length}`);

  let updatedCount = 0;

  for (const item of stockWithImages) {
    const currentPath = item.image;
    console.log(`\nProcessing: ID ${item.id}, Name: ${item.name}`);
    console.log(`  Current path: "${currentPath}"`);

    // Convert /images/filename.webp to /api/images?filename=filename.webp
    if (currentPath.startsWith('/images/')) {
      const filename = currentPath.split('/').pop();
      const newPath = `/api/images?filename=${filename}`;
      
      console.log(`  → Updating to: ${newPath}`);
      db.prepare("UPDATE stock SET image = ? WHERE id = ?").run(newPath, item.id);
      updatedCount++;
    } else {
      console.log(`  → Path already in correct format or unsupported`);
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Items processed: ${stockWithImages.length}`);
  console.log(`  Items updated: ${updatedCount}`);

  // Verify the update
  console.log('\nVerification:');
  const updatedStock = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images after update: ${updatedStock.length}`);
  
  updatedStock.forEach(item => {
    console.log(`  ✓ ID: ${item.id}, Name: ${item.name}, Image: ${item.image}`);
  });
}

// Run the function
updateToDirectApi().catch(console.error);
