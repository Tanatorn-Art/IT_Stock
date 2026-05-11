import fs from 'fs'
import path from 'path'
import { writeFile } from 'fs/promises'

let sharp
try {
  sharp = await import('sharp')
} catch (error) {
  console.warn('Sharp not available, using fallback image processing')
}

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

    // Ensure directory exists (Windows compatible path handling)
    const uploadDir = path.join(process.cwd(), 'public', 'images')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    // Generate unique filename with timestamp and stockId if provided
    const timestamp = Date.now()
    const baseName = stockId ? `${stockId}-${timestamp}` : `upload-${timestamp}`
    const webpFilename = `${baseName}.webp`

    let finalBuffer = buffer

    // Try to convert to WebP using Sharp, fallback to original format
    if (sharp) {
      try {
        finalBuffer = await sharp.default(buffer)
          .webp({ quality: 85 })
          .toBuffer()
      } catch (sharpError) {
        console.warn('Sharp processing failed, using original image:', sharpError.message)
        // Fallback: use original buffer and change extension to match format
        const imageType = image.match(/^data:image\/(\w+);base64,/)
        const extension = imageType ? imageType[1] : 'jpg'
        const finalFilename = `${baseName}.${extension}`
        const filePath = path.join(uploadDir, finalFilename)
        await writeFile(filePath, buffer)
        const publicPath = `/images/${finalFilename}`
        return res.status(200).json({ path: publicPath })
      }
    } else {
      // No Sharp available, use original format
      const imageType = image.match(/^data:image\/(\w+);base64,/)
      const extension = imageType ? imageType[1] : 'jpg'
      const finalFilename = `${baseName}.${extension}`
      const filePath = path.join(uploadDir, finalFilename)
      await writeFile(filePath, buffer)
      const publicPath = `/images/${finalFilename}`
      return res.status(200).json({ path: publicPath })
    }

    // Save WebP file (Windows compatible path)
    const filePath = path.join(uploadDir, webpFilename)
    await writeFile(filePath, finalBuffer)

    // Return the public path
    const publicPath = `/images/${webpFilename}`
    res.status(200).json({ path: publicPath })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload image: ' + error.message })
  }
}
