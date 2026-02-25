import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('[v0] Starting Prisma setup...');

try {
  // Generate Prisma client
  console.log('[v0] Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('[v0] Prisma client generated successfully');
} catch (error) {
  console.error('[v0] Error during setup:', error.message);
  process.exit(1);
}

console.log('[v0] Setup complete!');
