import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const backupDir = path.join(process.cwd(), 'backups')

    if (!fs.existsSync(backupDir)) {
      return res.status(200).json({ files: [] })
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sqlite'))
      .map(file => {
        const filePath = path.join(backupDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: (stats.size / 1024).toFixed(2) + ' KB',
          created: stats.birthtime.toISOString(),
          type: 'database'
        }
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created))

    res.status(200).json({ files })

  } catch (error) {
    console.error('Backup history API error:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
