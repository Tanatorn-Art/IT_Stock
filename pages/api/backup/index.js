import { createBackup, getBackupList, deleteBackup, cleanupOldBackups } from '../../../lib/backupManager'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb', // Allow large file uploads for restore
    },
  },
}

export default async function handler(req, res) {
  const { method } = req

  try {
    if (method === 'GET') {
      // Get list of backups
      const backups = getBackupList()
      return res.status(200).json({ backups })
    }

    if (method === 'POST') {
      const { action, reason } = req.body

      if (action === 'create') {
        // Create backup
        const backupFileName = await createBackup(reason || 'manual')
        return res.status(200).json({ 
          success: true, 
          message: 'Backup created successfully',
          fileName: backupFileName 
        })
      }

      if (action === 'cleanup') {
        // Clean up old backups
        const { keepCount = 10 } = req.body
        await cleanupOldBackups(keepCount)
        return res.status(200).json({ 
          success: true, 
          message: 'Old backups cleaned up successfully' 
        })
      }

      return res.status(400).json({ error: 'Invalid action' })
    }

    if (method === 'DELETE') {
      const { fileName } = req.query

      if (!fileName) {
        return res.status(400).json({ error: 'Backup file name is required' })
      }

      await deleteBackup(fileName)
      return res.status(200).json({ 
        success: true, 
        message: 'Backup deleted successfully' 
      })
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Backup API error:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
