import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const candidateEnvFiles = [
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../.env.local'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '../../.env.local'),
  path.resolve(__dirname, '../../.env'),
];

const loadedEnvFiles = new Set<string>();

for (const envFile of candidateEnvFiles) {
  if (fs.existsSync(envFile) && !loadedEnvFiles.has(envFile)) {
    dotenv.config({ path: envFile, quiet: true });
    loadedEnvFiles.add(envFile);
  }
}
