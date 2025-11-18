const fs = require('fs');
const path = require('path');

const DIRECTORY_PATH = path.join(__dirname, 'data/Trefle');

function countEntriesInFile(filePath, counts) {
  const fileStream = fs.createReadStream(filePath);
  const rl = require('readline').createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  return new Promise((resolve) => {
    rl.on('line', (line) => {
      try {
        const entry = JSON.parse(line);
        const hasImage = entry.image_url !== null;
        const hasCommonName = entry.common_name !== null;

        if (hasImage && !hasCommonName) {
          counts.imageNotNull_commonNull++;
        } else if (!hasImage && hasCommonName) {
          counts.imageNull_commonNotNull++;
        } else if (hasImage && hasCommonName) {
          counts.imageNotNull_commonNotNull++;
        }
      } catch (error) {
        console.error(`Error parsing line in file ${filePath}:`, error);
      }
    });

    rl.on('close', () => {
      resolve();
    });
  });
}

async function countEntriesInDirectory() {
  const counts = {
    imageNotNull_commonNull: 0,
    imageNull_commonNotNull: 0,
    imageNotNull_commonNotNull: 0,
  };

  const files = fs.readdirSync(DIRECTORY_PATH).filter((file) => file.endsWith('.ndjson'));

  for (const file of files) {
    const filePath = path.join(DIRECTORY_PATH, file);
    console.log(`Processing file: ${file}`);
    await countEntriesInFile(filePath, counts);
  }

  console.log('Total Counts:', counts);
}

countEntriesInDirectory();
