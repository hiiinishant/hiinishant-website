import fs from "fs";
import path from "path";

/**
 * Returns the path to a data file, copying the seed file from the frontend src/data directory
 * to the persistent data directory if it doesn't already exist.
 */
export function getDataFilePath(filename: string): string {
  // Find where the seed files are (could be ../src/data or ./src/data depending on process.cwd)
  let seedDir = path.join(process.cwd(), "../src/data");
  if (!fs.existsSync(seedDir)) {
    seedDir = path.join(process.cwd(), "src/data");
  }

  const dataDir = process.env.DATA_DIR || seedDir;
  const targetPath = path.join(dataDir, filename);
  const seedPath = path.join(seedDir, filename);

  // If we are using a custom persistent data directory and the file doesn't exist yet, seed it
  if (dataDir !== seedDir && !fs.existsSync(targetPath)) {
    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      if (fs.existsSync(seedPath)) {
        fs.copyFileSync(seedPath, targetPath);
        console.log(`🌱 Seeded database file: ${filename} -> ${targetPath}`);
      } else {
        // Fallback: create empty JSON array
        fs.writeFileSync(targetPath, JSON.stringify([], null, 2), "utf-8");
        console.log(`🌱 Created empty database file: ${filename} -> ${targetPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize database file ${filename}:`, error);
    }
  }

  return targetPath;
}
