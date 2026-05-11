import { initializeDatabase } from '../lib/database.js'

async function init() {
  try {
    console.log('Initializing database with borrows and requisitions tables...')
    await initializeDatabase()
    console.log('Database initialization completed successfully!')
  } catch (error) {
    console.error('Database initialization failed:', error)
    process.exit(1)
  }
}

init()
