import { restoreFromBackup } from '../../../lib/backupManager'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false, // Disable body parser to handle file upload
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'temp'),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    })

    const [fields, files] = await form.parse(req)
    const uploadedFile = files.file?.[0]

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Validate file type
    if (!uploadedFile.originalFilename?.endsWith('.sqlite')) {
      // Clean up uploaded file
      if (fs.existsSync(uploadedFile.filepath)) {
        fs.unlinkSync(uploadedFile.filepath)
      }
      return res.status(400).json({ error: 'Invalid file type. Please upload a .sqlite file' })
    }

    // Move uploaded file to backups directory with proper naming
    const backupsDir = path.join(process.cwd(), 'backups')
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true })
    }

    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .slice(0, 19)
    
    const backupFileName = `backup_${timestamp}_upload.sqlite`
    const backupPath = path.join(backupsDir, backupFileName)

    // Move uploaded file
    fs.renameSync(uploadedFile.filepath, backupPath)

    // Restore from uploaded backup
    await restoreFromBackup(backupFileName)

    // Clean up the uploaded backup file after restore
    if (fs.existsSync(backupPath)) {
      fs.unlinkSync(backupPath)
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Database restored successfully from uploaded file' 
    })

  } catch (error) {
    console.error('Restore API error:', error)
    
    // Clean up any temporary files
    try {
      const tempDir = path.join(process.cwd(), 'temp')
      if (fs.existsSync(tempDir)) {
        const files = fs.readdirSync(tempDir)
        files.forEach(file => {
          const filePath = path.join(tempDir, file)
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
        })
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup temp files:', cleanupError)
    }

    res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
