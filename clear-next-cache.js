import fs from 'fs';
import path from 'path';

// Clear .next directory
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  try {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✓ Cleared .next directory');
  } catch (error) {
    console.log('✓ Error clearing .next directory:', error.message);
    console.log('  Please manually delete the .next folder and restart the dev server');
  }
} else {
  console.log('✓ .next directory not found');
}

console.log('Next.js cache cleared. Please restart the dev server.');
