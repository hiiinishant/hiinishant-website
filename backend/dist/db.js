"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataFilePath = getDataFilePath;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Returns the path to a data file, copying the seed file from the frontend src/data directory
 * to the persistent data directory if it doesn't already exist.
 */
function getDataFilePath(filename) {
    // Find where the seed files are (could be ../src/data or ./src/data depending on process.cwd)
    let seedDir = path_1.default.join(process.cwd(), "../src/data");
    if (!fs_1.default.existsSync(seedDir)) {
        seedDir = path_1.default.join(process.cwd(), "src/data");
    }
    const dataDir = process.env.DATA_DIR || seedDir;
    const targetPath = path_1.default.join(dataDir, filename);
    const seedPath = path_1.default.join(seedDir, filename);
    // If we are using a custom persistent data directory and the file doesn't exist yet, seed it
    if (dataDir !== seedDir && !fs_1.default.existsSync(targetPath)) {
        try {
            if (!fs_1.default.existsSync(dataDir)) {
                fs_1.default.mkdirSync(dataDir, { recursive: true });
            }
            if (fs_1.default.existsSync(seedPath)) {
                fs_1.default.copyFileSync(seedPath, targetPath);
                console.log(`🌱 Seeded database file: ${filename} -> ${targetPath}`);
            }
            else {
                // Fallback: create empty JSON array
                fs_1.default.writeFileSync(targetPath, JSON.stringify([], null, 2), "utf-8");
                console.log(`🌱 Created empty database file: ${filename} -> ${targetPath}`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to initialize database file ${filename}:`, error);
        }
    }
    return targetPath;
}
