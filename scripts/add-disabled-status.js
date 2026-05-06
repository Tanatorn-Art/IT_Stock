import { getDatabase } from '../lib/database.js'
import { promisify } from 'util'

async function addDisabledStatus() {
  const db = getDatabase()
  const run = promisify(db.run.bind(db))

  try {
    // Add disabledAt column to stock table
    await run(`
      ALTER TABLE stock ADD COLUMN disabledAt DATETIME DEFAULT NULL
    `)
    
    console.log('Added disabledAt column to stock table')
    
    // Verify the column was added
    const schema = await promisify(db.all.bind(db))("PRAGMA table_info(stock)")
    const hasDisabledAt = schema.some(col => col.name === 'disabledAt')
    
    if (hasDisabledAt) {
      console.log('✅ Migration completed successfully')
    } else {
      console.log('❌ Migration failed - column not found')
    }
    
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✅ disabledAt column already exists')
    } else {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
}

// Run the migration
addDisabledStatus().then(() => {
  console.log('Migration completed')
  process.exit(0)
}).catch(error => {
  console.error('Migration failed:', error)
  process.exit(1)
})
