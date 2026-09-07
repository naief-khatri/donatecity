const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const DIRS_TO_CHECK = [
  path.join(__dirname, '../public/assets/buildings'),
  path.join(__dirname, '../public/assets/tiles')
];

const TARGET_WIDTH = 768;
const TARGET_HEIGHT = 512;

async function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.match(/\.(png|jpe?g)$/i)) continue;
    
    const filePath = path.join(dir, file);
    try {
      const image = await Jimp.read(filePath);
      const w = image.bitmap.width;
      const h = image.bitmap.height;
      
      if (w !== TARGET_WIDTH || h !== TARGET_HEIGHT) {
        console.log(`[RESIZING] ${file} (${w}x${h} -> ${TARGET_WIDTH}x${TARGET_HEIGHT})`);
        
        // Resize forcing the target dimensions to match the isometric grid requirements
        image.resize({ w: TARGET_WIDTH, h: TARGET_HEIGHT });
        
        await image.write(filePath);
        console.log(`✅ Fixed ${file}`);
      } else {
        console.log(`[OK] ${file} is already ${TARGET_WIDTH}x${TARGET_HEIGHT}`);
      }
    } catch (err) {
      console.error(`❌ Failed to process ${file}:`, err.message);
    }
  }
}

async function run() {
  console.log('🔍 Scanning assets for incorrect resolutions...');
  for (const dir of DIRS_TO_CHECK) {
    await processDirectory(dir);
  }
  console.log('🎉 Done checking resolutions!');
}

run();
