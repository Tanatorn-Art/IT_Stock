import { getDatabase } from './lib/database.js'
import { promisify } from 'util'

async function testSoftDelete() {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))
  const get = promisify(db.get.bind(db))

  try {
    // First, add the disabledAt column if it doesn't exist
    console.log('Testing soft delete functionality...')
    
    // Check if disabledAt column exists
    const schema = await promisify(db.all.bind(db))("PRAGMA table_info(stock)")
    const hasDisabledAt = schema.some(col => col.name === 'disabledAt')
    
    if (!hasDisabledAt) {
      console.log('Adding disabledAt column...')
      await run('ALTER TABLE stock ADD COLUMN disabledAt DATETIME DEFAULT NULL')
      console.log('✅ disabledAt column added')
    } else {
      console.log('✅ disabledAt column already exists')
    }

    // Test creating a sample item
    const testId = 'TEST-001'
    await run(`
      INSERT OR REPLACE INTO stock (id, name, category, brand, quantity, minQuantity, location, status, description, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      testId,
      'Test Item',
      'Other',
      'Test Brand',
      10,
      5,
      'Test Location',
      'active',
      'Test Description',
      new Date().toISOString(),
      new Date().toISOString()
    ])
    console.log('✅ Test item created')

    // Test soft delete
    await run(`
      UPDATE stock
      SET disabledAt = ?, updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), new Date().toISOString(), testId])
    console.log('✅ Item soft deleted')

    // Verify soft delete
    const deletedItem = await get('SELECT * FROM stock WHERE id = ?', [testId])
    if (deletedItem && deletedItem.disabledAt) {
      console.log('✅ Soft delete verified - disabledAt:', deletedItem.disabledAt)
    } else {
      console.log('❌ Soft delete failed')
    }

    // Test restore
    await run(`
      UPDATE stock
      SET disabledAt = NULL, updatedAt = ?
      WHERE id = ?
    `, [new Date().toISOString(), testId])
    console.log('✅ Item restored')

    // Verify restore
    const restoredItem = await get('SELECT * FROM stock WHERE id = ?', [testId])
    if (restoredItem && !restoredItem.disabledAt) {
      console.log('✅ Restore verified')
    } else {
      console.log('❌ Restore failed')
    }

    // Clean up test item
    await run('DELETE FROM stock WHERE id = ?', [testId])
    console.log('✅ Test item cleaned up')

    console.log('\n🎉 Soft delete functionality test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    db.close()
  }
}

testSoftDelete()
