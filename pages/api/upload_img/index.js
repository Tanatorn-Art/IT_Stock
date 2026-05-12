import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import formidable from 'formidable';
import { createReadStream, createWriteStream } from 'fs';

export const config = {
  api: {
    bodyParser: false, // ต้องปิด bodyParser เพื่อรับ multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = formidable({ keepExtensions: true });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const rawFilename = Array.isArray(fields.filename) ? fields.filename[0] : fields.filename;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const filename = rawFilename && rawFilename.length > 0
      ? rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `upload-${Date.now()}.webp`;

    // const saveDir = 'C:\\inetpub\\wwwroot\\IT-Stock\\data\\image';
    const saveDir = 'C:\\inetpub\\wwwroot\\IT-Stock-Dev-2026\\IT_stock\\data\\image';
    await mkdir(saveDir, { recursive: true });

    const savePath = join(saveDir, filename);

    // Copy temp file to destination
    await new Promise((resolve, reject) => {
      const reader = createReadStream(file.filepath);
      const writer = createWriteStream(savePath);
      reader.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return res.status(200).json({ success: true, path: `/api/images?filename=${filename}` });
  } catch (error) {
    console.error('Error uploading file:', error);
    return res.status(500).json({ success: false, message: 'Error uploading file' });
  }
}