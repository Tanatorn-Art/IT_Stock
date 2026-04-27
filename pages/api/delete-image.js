import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imagePath } = req.body

    if (!imagePath) {
      return res.status(400).json({ error: 'Missing image path' })
    }

    // Validate path to prevent directory traversal
    if (!imagePath.startsWith('/images/') || imagePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid image path' })
    }

    // Convert to file system path
    const filePath = path.join(process.cwd(), imagePath)

    // Check if file exists before deleting
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`Deleted image: ${imagePath}`)
    }

    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
}
