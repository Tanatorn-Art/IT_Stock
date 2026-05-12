import { readFile, stat } from 'fs/promises';
import { join } from 'path';

export default async function handler(req, res) {
  const { query } = req;
  let imageFilename = query.filename || req.query.filename || '';

  console.log('Direct image API called:', req.url);
  console.log('Query params:', req.query);
  console.log('Filename from query:', imageFilename);

  // If no filename in query, try to extract from URL path
  if (!imageFilename && req.url) {
    const urlParts = req.url.split('/');
    imageFilename = urlParts[urlParts.length - 1];
    console.log('Filename extracted from URL:', imageFilename);
  }

  if (!imageFilename) {
    return res.status(400).json({ error: 'Filename parameter is required' });
  }

  try {
    const imagePath = join('C:\\inetpub\\wwwroot\\IT-Stock-Dev-2026\\IT_stock\\data\\image', filename);
    console.log('Looking for file:', imagePath);

    const fileStats = await stat(imagePath);

    if (!fileStats.isFile()) {
      console.log('File not found:', imagePath);
      return res.status(404).json({ error: 'File not found' });
    }

    const fileBuffer = await readFile(imagePath);
    const ext = filename.split('.').pop().toLowerCase();

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

    console.log('Serving file:', filename, 'Size:', fileBuffer.length, 'Type:', contentType);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    return res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving image:', error);
    return res.status(500).json({ success: false, message: 'Error serving image' });
  }
}
