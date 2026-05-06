import { getLogs } from './lib/logger.js'

async function testApiLogs() {
  try {
    const today = new Date().toISOString().split('T')[0]
    console.log('Testing with date:', today)
    
    const logs = await getLogs({
      startDate: today,
      endDate: today,
      limit: 10
    })
    
    console.log('Logs returned:', logs.length)
    console.log('First log:', logs[0])
    
  } catch (error) {
    console.error('Test error:', error)
  } finally {
    process.exit(0)
  }
}

testApiLogs()
