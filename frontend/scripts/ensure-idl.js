#!/usr/bin/env node

import { existsSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const IDL_FILENAME = 'idl.json';
const SOURCE_IDL_FILENAME = 'blueshift_anchor_escrow.json';

const idlPath = join(__dirname, '..', 'src', IDL_FILENAME);
const sourcePath = join(__dirname, '..', '..', 'target', 'idl', SOURCE_IDL_FILENAME);

/**
 * Ensures the IDL file exists in the frontend src directory.
 * Copies from target/idl if available, otherwise uses existing file.
 */
function ensureIdlFile() {
  try {
    // Check if IDL file already exists in src/
    if (existsSync(idlPath)) {
      console.log('✅ IDL file already exists in src/idl.json');
      return;
    }

    // Try to copy from target/idl/
    if (existsSync(sourcePath)) {
      console.log('📋 Copying IDL from target/idl/');
      copyFileSync(sourcePath, idlPath);
      console.log('✅ IDL file copied successfully');
    } else {
      console.log('⚠️  IDL source not found, but this is expected in deployment');
      console.log('   The existing IDL file in the repository will be used');
    }
  } catch (error) {
    console.error('❌ Error handling IDL file:', error.message);
    process.exit(1);
  }
}

ensureIdlFile();