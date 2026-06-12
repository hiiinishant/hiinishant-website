import fs from "fs";
import path from "path";

/**
 * Returns the path to a data file, copying the seed file from the src/data directory
 * to the persistent data directory if it doesn't already exist.
 */
export function getDataFilePath(filename: string): string {
  const seedDir = path.join(process.cwd(), "src/data");
  const dataDir = process.env.DATA_DIR || seedDir;
  
  const targetPath = path.join(dataDir, filename);
  const seedPath = path.join(seedDir, filename);

  // If we are using a custom persistent data directory (like on Render)
  // and the file does not exist there yet, copy the seed file from the source code.
  if (dataDir !== seedDir && !fs.existsSync(targetPath)) {
    try {
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Copy the seed file if it exists in the codebase
      if (fs.existsSync(seedPath)) {
        fs.copyFileSync(seedPath, targetPath);
        console.log(`🌱 Seeded database file: ${filename} -> ${targetPath}`);
      } else {
        // Otherwise, create an empty array or object as a default
        fs.writeFileSync(targetPath, JSON.stringify([], null, 2), "utf-8");
        console.log(`🌱 Created empty database file: ${filename} -> ${targetPath}`);
      }
    } catch (error) {
      console.error(`❌ Failed to initialize database file ${filename}:`, error);
    }
  }

  return targetPath;
}
