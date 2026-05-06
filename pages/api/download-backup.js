import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { method, query } = req

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { file } = query

  if (!file) {
    return res.status(400).json({ error: 'Filename is required' })
  }

  try {
    const backupDir = path.join(process.cwd(), 'backups')
    const filePath = path.join(backupDir, file)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Check if file is a SQLite backup file
    if (!file.endsWith('.sqlite')) {
      return res.status(400).json({ error: 'Only SQLite backup files can be downloaded' })
    }

    // Read and serve the file
    const fileContent = fs.readFileSync(filePath)
    const stats = fs.statSync(filePath)

    // Set Content-Type for SQLite file
    res.setHeader('Content-Type', 'application/x-sqlite3')
    res.setHeader('Content-Disposition', `attachment; filename="${file}"`)
    res.setHeader('Content-Length', stats.size)

    res.send(fileContent)
  } catch (error) {
    console.error('Download backup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
