import { getDatabase } from '../lib/database.js'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

async function debugImages() {
  console.log('=== Debugging Image Issues ===')
  
  const db = getDatabase()
  const all = promisify(db.all.bind(db))
  
  try {
    // Get all stock items with images
    const stockItems = await all('SELECT id, name, image FROM stock WHERE image IS NOT NULL AND image != ""')
    console.log(`Found ${stockItems.length} stock items with images:`)
    
    stockItems.forEach(item => {
      console.log(`- ${item.id}: ${item.name}`)
      console.log(`  Image: ${item.image}`)
      
      // Check if file exists
      if (item.image) {
        const filePath = path.join(process.cwd(), item.image)
        const exists = fs.existsSync(filePath)
        console.log(`  File exists: ${exists}`)
        console.log(`  File path: ${filePath}`)
      }
      console.log('')
    })
    
    // Check what's in the images directory
    const imagesDir = path.join(process.cwd(), 'public', 'images')
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir)
      console.log(`Files in images directory (${files.length}):`)
      files.forEach(file => {
        const fullPath = path.join(imagesDir, file)
        const stats = fs.statSync(fullPath)
        console.log(`- ${file} (${stats.size} bytes)`)
      })
    } else {
      console.log('Images directory does not exist')
    }
    
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    db.close()
  }
}

debugImages()
