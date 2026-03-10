import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertImage(filepath, outpath) {
  try {
    await sharp(filepath).webp({ quality: 80 }).toFile(outpath);
    console.log(`Converted ${filepath} to ${outpath}`);
  } catch (err) {
    console.error(`Error converting ${filepath}:`, err);
  }
}

async function main() {
  const publicDir = path.join(__dirname, 'public');
  await convertImage(path.join(publicDir, 'logo.png'), path.join(publicDir, 'logo.webp'));
  await convertImage(path.join(publicDir, 'og-banner.png'), path.join(publicDir, 'og-banner.webp'));
}

main();
