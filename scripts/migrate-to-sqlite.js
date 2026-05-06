import { initializeDatabase, getDatabase, closeDatabase } from '../lib/database.js'
import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

const readFile = promisify(fs.readFile)

async function migrateData() {
  try {
    console.log('Starting migration to SQLite...')
    
    // Initialize database
    await initializeDatabase()
    const db = getDatabase()
    
    const run = promisify(db.run.bind(db))
    
    // Read JSON files
    const locationsPath = path.join(process.cwd(), 'data', 'locations.json')
    const stockPath = path.join(process.cwd(), 'data', 'stock.json')
    const transactionsPath = path.join(process.cwd(), 'data', 'transactions.json')
    const shelfConfigPath = path.join(process.cwd(), 'data', 'shelfConfig.json')
    
    const locationsData = JSON.parse(await readFile(locationsPath, 'utf8'))
    const stockData = JSON.parse(await readFile(stockPath, 'utf8'))
    const transactionsData = JSON.parse(await readFile(transactionsPath, 'utf8'))
    const shelfConfigData = JSON.parse(await readFile(shelfConfigPath, 'utf8'))
    
    console.log(`Migrating ${locationsData.length} locations...`)
    
    // Clear existing data
    await run('DELETE FROM locations')
    await run('DELETE FROM stock')
    await run('DELETE FROM transactions')
    await run('DELETE FROM shelf_config')
    
    // Migrate locations
    for (const location of locationsData) {
      await run(`
        INSERT INTO locations (id, name, description, image, shelfId, status, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        location.id,
        location.name,
        location.description || '',
        location.image || '',
        location.shelfId || null,
        location.status || 'active',
        location.createdAt || new Date().toISOString(),
        location.updatedAt || new Date().toISOString()
      ])
    }
    
    console.log(`Migrating ${stockData.length} stock items...`)
    
    // Migrate stock
    for (const item of stockData) {
      await run(`
        INSERT INTO stock (id, name, category, brand, model, serial, quantity, minQuantity, location, status, description, image, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        item.id,
        item.name,
        item.category || '',
        item.brand || '',
        item.model || '',
        item.serial || '',
        item.quantity || 0,
        item.minQuantity || 0,
        item.location || '',
        item.status || 'active',
        item.description || '',
        item.image || '',
        item.createdAt || new Date().toISOString(),
        item.updatedAt || new Date().toISOString()
      ])
    }
    
    console.log(`Migrating ${transactionsData.length} transactions...`)
    
    // Migrate transactions
    for (const transaction of transactionsData) {
      await run(`
        INSERT INTO transactions (txnId, itemId, itemName, type, qty, qtyBefore, qtyAfter, note, by, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        transaction.txnId,
        transaction.itemId,
        transaction.itemName,
        transaction.type,
        transaction.qty,
        transaction.qtyBefore,
        transaction.qtyAfter,
        transaction.note || '',
        transaction.by || 'System',
        transaction.createdAt || new Date().toISOString()
      ])
    }
    
    console.log('Migrating shelf configuration...')
    
    // Migrate shelf config
    await run(`
      INSERT INTO shelf_config (id, config)
      VALUES (?, ?)
    `, ['main', JSON.stringify(shelfConfigData)])
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    closeDatabase()
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData()
}

export { migrateData }
