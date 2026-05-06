import { getDatabase } from '../../lib/database.js'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Generate filename with format IT_Stock_BackUp_yyyymmdd_hhmmss
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const filename = `IT_Stock_BackUp_${year}${month}${day}_${hours}${minutes}${seconds}.sqlite`

    // Copy the database file
    const dbPath = path.join(process.cwd(), 'database.sqlite')
    const backupDir = path.join(process.cwd(), 'backups')

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupPath = path.join(backupDir, filename)
    fs.copyFileSync(dbPath, backupPath)

    res.status(200).json({
      success: true,
      filename,
      message: `Database backup created successfully: ${filename}`
    })

  } catch (error) {
    console.error('Backup API error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
