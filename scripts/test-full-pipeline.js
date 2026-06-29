import { getDatabase } from '../lib/database.js';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

// Test the complete image serving pipeline
async function testFullPipeline() {
  console.log('Testing complete image serving pipeline...');
  console.log('=======================================');

  const db = getDatabase();
  const imageDir = join(process.cwd(), 'data', 'image');

  // Step 1: Check database state
  console.log('\n1. Database State:');
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`   Items with images: ${stockWithImages.length}`);
  
  stockWithImages.forEach(item => {
    console.log(`   - ID: ${item.id}, Name: ${item.name}, Image: "${item.image}"`);
  });

  // Step 2: Check file existence
  console.log('\n2. File Existence Check:');
  for (const item of stockWithImages) {
    const imagePath = item.image;
    const filename = imagePath.split('/').pop();
    const fullPath = join(imageDir, filename);
    
    try {
      const fileStat = await stat(fullPath);
      const fileSize = (fileStat.size / 1024).toFixed(2);
      console.log(`   ✓ ${item.id}: File exists (${fileSize} KB) - ${filename}`);
    } catch (error) {
      console.log(`   ✗ ${item.id}: File missing - ${filename}`);
    }
  }

  // Step 3: Test file content (can we read it?)
  console.log('\n3. File Content Test:');
  for (const item of stockWithImages) {
    const imagePath = item.image;
    const filename = imagePath.split('/').pop();
    const fullPath = join(imageDir, filename);
    
    try {
      const fileBuffer = await readFile(fullPath);
      const fileSize = fileBuffer.length;
      const header = fileBuffer.slice(0, 8).toString('hex');
      console.log(`   ✓ ${item.id}: Can read file (${fileSize} bytes) - Header: ${header}`);
      
      // Check if it's a valid image file
      if (header.startsWith('52494646') || header.startsWith('89504e47') || header.startsWith('ffd8ff')) {
        console.log(`     Valid image format detected`);
      } else {
        console.log(`     ⚠ May not be a valid image file`);
      }
    } catch (error) {
      console.log(`   ✗ ${item.id}: Cannot read file - ${error.message}`);
    }
  }

  // Step 4: Expected URL format verification
  console.log('\n4. URL Format Verification:');
  console.log('   Expected URL pattern: /images/filename.webp');
  console.log('   Next.js routing: /images/* -> /api/images/* -> serves from data/image');
  
  for (const item of stockWithImages) {
    const imagePath = item.image;
    const isValidFormat = (imagePath.startsWith('/images/') || imagePath.startsWith('/api/images')) && imagePath.includes('.webp');
    console.log(`   ${item.id}: "${imagePath}" ${isValidFormat ? '✓' : '✗'}`);
  }

  // Step 5: Summary
  console.log('\n5. Summary:');
  console.log(`   Total items with image references: ${stockWithImages.length}`);
  
  let validCount = 0;
  for (const item of stockWithImages) {
    const imagePath = item.image;
    let filename = imagePath.split('/').pop();
    if (filename.includes('filename=')) {
      filename = filename.split('filename=').pop();
    }
    const fullPath = join(imageDir, filename);
    
    try {
      await stat(fullPath);
      if ((imagePath.startsWith('/images/') || imagePath.startsWith('/api/images')) && imagePath.includes('.webp')) {
        validCount++;
      }
    } catch (error) {
      // File doesn't exist
    }
  }
  
  console.log(`   Items with valid images: ${validCount}`);
  console.log(`   Expected to display: ${validCount} images`);
  
  if (validCount === stockWithImages.length) {
    console.log('\n✅ All image references are valid and should display');
    console.log('   If images are still not showing, the issue may be:');
    console.log('   - Next.js development server needs restart');
    console.log('   - Browser caching issues');
    console.log('   - Image serving API route not working');
    console.log('   - Next.js routing configuration not loaded');
  } else {
    console.log('\n❌ Some image references are still invalid');
  }
}

// Run the function
testFullPipeline().catch(console.error);
