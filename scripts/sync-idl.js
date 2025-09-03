#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "..");
const idlSource = join(projectRoot, "target/idl/blueshift_anchor_escrow.json");
const idlTarget = join(projectRoot, "frontend/src/idl.json");

function syncIdl() {
  try {
    if (!existsSync(idlSource)) {
      console.error(
        "❌ IDL source file not found. Please build the program first with: anchor build"
      );
      process.exit(1);
    }

    const idlContent = readFileSync(idlSource, "utf8");
    writeFileSync(idlTarget, idlContent);

    console.log("✅ IDL synced successfully from target/idl to frontend/src");
  } catch (error) {
    console.error("❌ Failed to sync IDL:", error.message);
    process.exit(1);
  }
}

syncIdl();
