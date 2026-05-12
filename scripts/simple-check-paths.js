import { getDatabase } from '../lib/database.js';

// Simple script to check database and fix image paths
const db = getDatabase();

console.log('Checking database schema...');
console.log('=========================');

// First, check if the stock table exists and its columns
try {
  const tableInfo = db.prepare("PRAGMA table_info(stock)").all();
  console.log('Stock table columns:');
  tableInfo.forEach(col => {
    console.log(`  ${col.name}: ${col.type}`);
  });
} catch (error) {
  console.log('Error checking table info:', error.message);
}

console.log('\nChecking for image column...');
try {
  // Try a simple query first
  const testQuery = db.prepare("SELECT COUNT(*) as count FROM stock").get();
  console.log(`Total stock items: ${testQuery.count}`);
  
  // Now try to get items with images using a simpler approach
  const stockWithImages = db.prepare("SELECT id, name, image FROM stock WHERE image IS NOT NULL AND length(image) > 0").all();
  console.log(`Items with images: ${stockWithImages.length}`);
  
  if (stockWithImages.length > 0) {
    console.log('\nCurrent image paths:');
    stockWithImages.forEach(item => {
      console.log(`  ID: ${item.id}, Name: ${item.name}, Image: "${item.image}"`);
    });
  }
} catch (error) {
  console.log('Error querying stock:', error.message);
}
