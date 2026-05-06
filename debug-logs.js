import { getDatabase } from './lib/database.js'
import { promisify } from 'util'

async function debugLogs() {
  try {
    const db = getDatabase()
    const all = promisify(db.all.bind(db))
    
    // Check if table exists and has data
    const count = await all('SELECT COUNT(*) as count FROM activity_logs')
    console.log('Total logs in database:', count[0].count)
    
    // Get recent logs
    const recentLogs = await all('SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 10')
    console.log('Recent logs:', recentLogs)
    
  } catch (error) {
    console.error('Debug error:', error)
  } finally {
    process.exit(0)
  }
}

debugLogs()
