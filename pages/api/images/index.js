import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  console.log('Image API index called:', req.method, req.url);
  console.log('Query params:', req.query);

  // Handle different request methods
  if (req.method === 'GET') {
    const { filename } = req.query;

    console.log('Filename from query:', filename);

    // If no filename in query, try to extract from URL path
    let imageFilename = filename;
    if (!imageFilename && req.url) {
      // Extract filename from URL like /api/images/filename.webp
      const urlParts = req.url.split('/');
      imageFilename = urlParts[urlParts.length - 1];

      // Remove any query parameters
      const queryIndex = imageFilename.indexOf('?');
      if (queryIndex > -1) {
        imageFilename = imageFilename.substring(0, queryIndex);
      }

      console.log('Filename extracted from URL:', imageFilename);
    }

    if (!imageFilename) {
      console.log('No filename found');
      return res.status(400).json({ error: 'Filename parameter is required' });
    }

    try {
      const imagePath = join(process.cwd(), 'data', 'image', imageFilename);
      console.log('Looking for file:', imagePath);

      const fileStats = await stat(imagePath);

      if (!fileStats.isFile()) {
        console.log('File not found:', imagePath);
        return res.status(404).json({ error: 'File not found' });
      }

      const fileBuffer = await readFile(imagePath);
      const ext = imageFilename.split('.').pop().toLowerCase();

      // Set appropriate content type based on file extension
      const contentTypes = {
        'webp': 'image/webp',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'svg': 'image/svg+xml'
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';

      console.log('Serving file:', imageFilename, 'Size:', fileBuffer.length, 'Type:', contentType);

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      return res.send(fileBuffer);
    } catch (error) {
      console.error('Error serving image:', error);
      return res.status(500).json({ success: false, message: 'Error serving image' });
    }
  }

  // Handle other methods
  return res.status(405).json({ error: 'Method not allowed' });
}
