#!/usr/bin/env node

/**
 * Validate generated files hook
 *
 * Prevents manual edits to auto-generated markdown files by checking .agent/generated-files.json.
 * This script is called by the pre-commit hook.
 *
 * Exit codes:
 * - 0: Validation passed (allow commit)
 * - 1: Validation failed (block commit)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

function main() {
  const registryPath = path.join(process.cwd(), '.agent', 'generated-files.json');

  // Check if registry exists
  if (!fs.existsSync(registryPath)) {
    console.log(`${YELLOW}⚠️  Warning: .agent/generated-files.json not found.${RESET}`);
    console.log(`${YELLOW}   Skipping validation. Run 'pnpm run sync:markdown' to create registry.${RESET}`);
    process.exit(0);
  }

  // Read registry
  let registry;
  try {
    const content = fs.readFileSync(registryPath, 'utf8');
    registry = JSON.parse(content);
  } catch (error) {
    console.error(`${RED}❌ ERROR: Failed to read generated files registry${RESET}`);
    console.error(`${RED}   ${error.message}${RESET}`);
    process.exit(1);
  }

  // Get generated file paths
  const generatedPaths = registry.generatedFiles.map((f) => f.path);

  if (generatedPaths.length === 0) {
    // No generated files to protect yet
    console.log(`${GREEN}✅ Generated files validation passed (no generated files yet)${RESET}`);
    process.exit(0);
  }

  // Get staged files
  let stagedFiles;
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    stagedFiles = output.split('\n').filter(Boolean);
  } catch (error) {
    console.error(`${RED}❌ ERROR: Failed to get staged files${RESET}`);
    console.error(`${RED}   ${error.message}${RESET}`);
    process.exit(1);
  }

  // Check for protected file edits
  const protectedEdits = stagedFiles.filter((file) =>
    generatedPaths.includes(file)
  );

  if (protectedEdits.length > 0) {
    console.error(`${RED}╔═══════════════════════════════════════════════════════════════╗${RESET}`);
    console.error(`${RED}║  ❌ COMMIT BLOCKED: Manual edits to generated files detected  ║${RESET}`);
    console.error(`${RED}╚═══════════════════════════════════════════════════════════════╝${RESET}`);
    console.error('');
    console.error(`${RED}Protected files:${RESET}`);
    protectedEdits.forEach((file) => {
      const fileInfo = registry.generatedFiles.find((f) => f.path === file);
      console.error(`  ${RED}•${RESET} ${file}`);
      if (fileInfo) {
        console.error(`    ${YELLOW}Category:${RESET} ${fileInfo.category}`);
        console.error(`    ${YELLOW}Template:${RESET} ${fileInfo.templateId}`);
      }
    });
    console.error('');
    console.error(`${YELLOW}ℹ️  These files are auto-generated from the database.${RESET}`);
    console.error(`${YELLOW}   To update them, use:${RESET} ${GREEN}pnpm run sync:markdown${RESET}`);
    console.error('');
    console.error(`${YELLOW}⚠️  To bypass this check (emergencies only):${RESET}`);
    console.error(`   ${GREEN}git commit --no-verify${RESET}`);
    console.error('');
    process.exit(1);
  }

  console.log(`${GREEN}✅ Generated files validation passed${RESET}`);
  process.exit(0);
}

main();
