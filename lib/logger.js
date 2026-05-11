import fs from 'fs'
import path from 'path'
import { getDatabase } from './database.js'

const LOG_DIR = path.join(process.cwd(), 'logs')

/**
 * Ensure log directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true })
  }
}

/**
 * Generate log filename for current date
 */
function getLogFileName() {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `activity_${today}.log`
}

/**
 * Write log entry to file
 * @param {string} level - log level (error, normal, warning, info)
 * @param {string} category - log category (backup, restore, api, user_action, etc.)
 * @param {string} message - log message
 * @param {Object} metadata - additional metadata
 */
function writeToFile(level, category, message, metadata = {}) {
  try {
    ensureLogDir()

    const logFileName = getLogFileName()
    const logFilePath = path.join(LOG_DIR, logFileName)

    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      category,
      message,
      metadata
    }

    const logLine = JSON.stringify(logEntry) + '\n'
    fs.appendFileSync(logFilePath, logLine)
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

/**
 * Log activity to both database and file
 * @param {string} category - log category
 * @param {string} level - log level (error, normal, warning, info)
 * @param {string} message - log message
 * @param {Object} metadata - additional metadata
 */
export function logActivity(category, level, message, metadata = {}) {
  try {
    // Write to file
    writeToFile(level, category, message, metadata)

    // Also store in database for querying
    const db = getDatabase()

    db.prepare(`
      INSERT INTO activity_logs (category, level, message, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      category,
      level,
      message,
      JSON.stringify(metadata),
      new Date().toISOString()
    )

  } catch (error) {
    console.error('Failed to log activity:', error)
    // Fallback to console only
    console.log(`[${level.toUpperCase()}] ${category}: ${message}`)
  }
}

/**
 * Get activity logs from database with filtering
 * @param {Object} options - Query options
 * @returns {Array} - Array of log entries
 */
export function getLogs(options = {}) {
  const {
    level = null,
    category = null,
    limit = 100,
    offset = 0,
    startDate = null,
    endDate = null
  } = options

  try {
    const db = getDatabase()

    let query = 'SELECT * FROM activity_logs WHERE 1=1'
    const params = []

    if (level) {
      query += ' AND level = ?'
      params.push(level)
    }

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    if (startDate) {
      query += ' AND date(timestamp) >= date(?)'
      params.push(startDate)
    }

    if (endDate) {
      query += ' AND date(timestamp) <= date(?)'
      params.push(endDate + ' 23:59:59')
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const logs = db.prepare(query).all(...params)

    // Parse metadata JSON
    return logs.map(log => ({
      ...log,
      metadata: JSON.parse(log.metadata || '{}')
    }))
  } catch (error) {
    console.error('Failed to get logs:', error)
    return []
  }
}

/**
 * Get log statistics
 * @returns {Object} - Log statistics
 */
export function getLogStats() {
  try {
    const db = getDatabase()

    const stats = db.prepare(`
      SELECT
        level,
        category,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM activity_logs
      WHERE timestamp >= date('now', '-30 days')
      GROUP BY level, category, DATE(timestamp)
      ORDER BY date DESC, count DESC
    `).all()

    return stats
  } catch (error) {
    console.error('Failed to get log stats:', error)
    return []
  }
}

/**
 * Clean up old log files (keep last 30 days)
 */
export function cleanupOldLogs() {
  try {
    ensureLogDir()

    const files = fs.readdirSync(LOG_DIR)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    files.forEach(file => {
      if (file.endsWith('.log')) {
        const filePath = path.join(LOG_DIR, file)
        const stats = fs.statSync(filePath)

        if (stats.mtime < thirtyDaysAgo) {
          fs.unlinkSync(filePath)
          console.log(`Deleted old log file: ${file}`)
        }
      }
    })
  } catch (error) {
    console.error('Failed to cleanup old logs:', error)
  }
}

/**
 * Get available log categories
 * @returns {Array} - Array of unique categories
 */
export function getLogCategories() {
  try {
    const db = getDatabase()

    const categories = db.prepare(`
      SELECT DISTINCT category
      FROM activity_logs
      ORDER BY category
    `).all()

    return categories.map(row => row.category)
  } catch (error) {
    console.error('Failed to get log categories:', error)
    return []
  }
}
