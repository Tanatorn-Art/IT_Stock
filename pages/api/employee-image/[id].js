export default async function handler(req, res) {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ error: 'Employee ID is required' })
  }

  try {
    // ลองทั้ง .jpg และ .png
    const extensions = ['.jpg', '.png']
    let lastError = null

    for (const ext of extensions) {
      const imageUrl = `http://10.35.10.79/ImageEmployee/${id}${ext}`
      console.log('Fetching employee image from:', imageUrl)

      try {
        const response = await fetch(imageUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
          },
          signal: AbortSignal.timeout(10000), // 10 วินาที
        })

        console.log('Response status:', response.status)

        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/jpeg'
          const imageBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(imageBuffer)

          console.log('Image buffer size:', buffer.length, 'bytes')
          console.log('Content type:', contentType)

          if (buffer.length === 0) {
            console.error('Empty image buffer')
            continue
          }

          // ส่งรูปกลับไป
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'public, max-age=3600')
          res.send(buffer)
          return
        }
      } catch (error) {
        console.error(`Error fetching ${ext}:`, error.message)
        lastError = error
      }
    }

    // ถ้าลองทั้งสอง format แล้วไม่สำเร็จ
    console.error('Failed to fetch image with all extensions')
    res.status(404).json({
      error: 'Employee image not found',
      tried: extensions.map(ext => `http://10.35.10.79/ImageEmployee/${id}${ext}`),
      message: lastError?.message
    })
  } catch (error) {
    console.error('Error fetching employee image:', error)
    res.status(500).json({
      error: 'Failed to fetch employee image',
      message: error.message
    })
  }
}
