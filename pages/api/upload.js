import fs from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'
import sharp from 'sharp'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, filename, stockId } = req.body

    if (!image || !filename) {
      return res.status(400).json({ error: 'Missing image or filename' })
    }

    // Remove data:image/xxx;base64, prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Ensure directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'images')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename with timestamp and stockId if provided
    const timestamp = Date.now()
    const baseName = stockId ? `${stockId}-${timestamp}` : `upload-${timestamp}`
    const webpFilename = `${baseName}.webp`

    // Convert to WebP using Sharp
    const webpBuffer = await sharp(buffer)
      .webp({ quality: 85 })
      .toBuffer()

    // Save WebP file
    const filePath = path.join(uploadDir, webpFilename)
    await writeFile(filePath, webpBuffer)

    // Return the public path
    const publicPath = `/images/${webpFilename}`
    res.status(200).json({ path: publicPath })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
}
