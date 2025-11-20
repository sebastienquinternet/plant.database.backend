const fs = require('fs');
const path = require('path');

const GBIF_FOLDER = path.join(__dirname, 'data/GBIF');

function countEntriesInDirectory() {
  let totalEntries = 0;

  const files = fs.readdirSync(GBIF_FOLDER).filter((file) => file.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(GBIF_FOLDER, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data)) {
        const count = data.length;
        totalEntries += count;
        console.log(`File: ${file}, Entries: ${count}`);
      } else {
        console.warn(`File: ${file} does not contain a valid JSON array.`);
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }

  console.log(`Total Entries: ${totalEntries}`);
}

countEntriesInDirectory();
