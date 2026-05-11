import fs from 'fs'
import path from 'path'
import { getDatabase, closeDatabase } from './database.js'
import { logActivity } from './logger.js'

const BACKUP_DIR = path.join(process.cwd(), 'backups')

/**
 * Ensure backup directory exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

/**
 * Generate timestamp for backup filename
 */
function generateTimestamp() {
  const now = new Date()
  return now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19) // YYYY-MM-DD_HH-MM-SS
}

/**
 * Create database backup
 * @param {string} reason - Reason for backup (optional)
 * @returns {string} - Backup file path
 */
export async function createBackup(reason = 'manual') {
  try {
    ensureBackupDir()

    const timestamp = generateTimestamp()
    const backupFileName = `backup_${timestamp}_${reason}.sqlite`
    const backupPath = path.join(BACKUP_DIR, backupFileName)

    // Close database connection before copying
    closeDatabase()

    // Copy database file
    const dbPath = path.join(process.cwd(), 'database.sqlite')
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath)
      console.log(`Database backup created: ${backupFileName}`)

      // Log the backup operation
      logActivity('backup', 'success', `Created backup: ${backupFileName}`, { reason, fileName: backupFileName })

      return backupFileName
    } else {
      throw new Error('Database file not found')
    }
  } catch (error) {
    console.error('Backup failed:', error)
    logActivity('backup', 'error', `Backup failed: ${error.message}`, { reason })
    throw error
  }
}

/**
 * Restore database from backup
 * @param {string} backupFileName - Name of backup file
 * @returns {boolean} - Success status
 */
export async function restoreFromBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName)
    const dbPath = path.join(process.cwd(), 'database.sqlite')

    if (!fs.existsSync(backupPath)) {
      throw new Error('Backup file not found')
    }

    // Create automatic backup before restore
    await createBackup('pre-restore')

    // Close database connection before restore
    closeDatabase()

    // Restore database
    fs.copyFileSync(backupPath, dbPath)
    console.log(`Database restored from: ${backupFileName}`)

    // Log the restore operation
    logActivity('restore', 'success', `Restored from backup: ${backupFileName}`, { fileName: backupFileName })

    return true
  } catch (error) {
    console.error('Restore failed:', error)
    logActivity('restore', 'error', `Restore failed: ${error.message}`, { fileName: backupFileName })
    throw error
  }
}

/**
 * Get list of available backups
 * @returns {Array} - List of backup files with metadata
 */
export function getBackupList() {
  try {
    ensureBackupDir()

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sqlite') && file.startsWith('backup_'))
      .sort((a, b) => b.localeCompare(a)) // Sort by date (newest first)

    return files.map(file => {
      const filePath = path.join(BACKUP_DIR, file)
      const stats = fs.statSync(filePath)

      // Extract timestamp and reason from filename
      const match = file.match(/backup_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})_(.+)\.sqlite/)
      const timestamp = match ? match[1] : ''
      const reason = match ? match[2] : 'unknown'

      return {
        fileName: file,
        timestamp,
        reason,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to get backup list:', error)
    return []
  }
}

/**
 * Delete backup file
 * @param {string} backupFileName - Name of backup file to delete
 * @returns {boolean} - Success status
 */
export async function deleteBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName)

    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath)
      console.log(`Backup deleted: ${backupFileName}`)

      logActivity('backup_delete', 'success', `Deleted backup: ${backupFileName}`, { fileName: backupFileName })
      return true
    } else {
      throw new Error('Backup file not found')
    }
  } catch (error) {
    console.error('Failed to delete backup:', error)
    logActivity('backup_delete', 'error', `Failed to delete backup: ${error.message}`, { fileName: backupFileName })
    throw error
  }
}

/**
 * Clean up old backups (keep only the latest N backups)
 * @param {number} keepCount - Number of backups to keep
 */
export async function cleanupOldBackups(keepCount = 10) {
  try {
    const backups = getBackupList()

    if (backups.length > keepCount) {
      const toDelete = backups.slice(keepCount)

      for (const backup of toDelete) {
        await deleteBackup(backup.fileName)
      }

      console.log(`Cleaned up ${toDelete.length} old backups`)
      logActivity('backup_cleanup', 'success', `Cleaned up ${toDelete.length} old backups`, { deletedCount: toDelete.length })
    }
  } catch (error) {
    console.error('Backup cleanup failed:', error)
    logActivity('backup_cleanup', 'error', `Backup cleanup failed: ${error.message}`, {})
  }
}
