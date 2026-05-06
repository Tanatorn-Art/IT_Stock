import { initializeDatabase } from '../lib/database.js'

console.log('Initializing database...')
await initializeDatabase()
console.log('Database initialized successfully!')
