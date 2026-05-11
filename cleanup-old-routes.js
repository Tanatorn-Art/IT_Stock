import fs from 'fs';
import path from 'path';

const filesToDelete = [
  'pages/api/borrows/route.js',
  'pages/api/requisitions/route.js',
  'pages/api/borrows/[id]/route.js',
  'pages/api/requisitions/[id]/route.js'
];

filesToDelete.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`Deleted: ${file}`);
  } else {
    console.log(`Not found: ${file}`);
  }
});
