import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Needed because __dirname is not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = process.cwd();

function ensureDir(p) {
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    if (!stat.isDirectory()) {
      throw new Error(`Path exists but is not a directory: ${p}`);
    }
    return;
  }

  fs.mkdirSync(p, { recursive: true });
  console.log("Created:", p);
}

function ensureFile(p, content = "") {
  if (!fs.existsSync(p)) {
    fs.writeFileSync(p, content);
    console.log("Created file:", p);
  }
}

function createNotebook(name) {
  const nbPath = path.join(ROOT, "notebooks", name);

  ensureDir(nbPath);

  // Artifacts
  ensureDir(path.join(nbPath, "artifacts", "drafts"));
  ensureDir(path.join(nbPath, "artifacts", "instrumentation"));
  ensureDir(path.join(nbPath, "artifacts", "moderation"));
  ensureDir(path.join(nbPath, "artifacts", "responses"));

  // Other folders
  ensureDir(path.join(nbPath, "prompts"));
  ensureDir(path.join(nbPath, "proposals"));

  // Notebook metadata
  ensureFile(
    path.join(nbPath, "notebook.pnb"),
    JSON.stringify(
      {
        id: name,
        created: new Date().toISOString(),
        version: "1.0"
      },
      null,
      2
    )
  );
}

function removeInvalidStructures() {
  const invalidPath = path.join(ROOT, "notebooks", "notebooks");

  if (fs.existsSync(invalidPath)) {
    console.log("⚠ Removing invalid nested notebooks structure:", invalidPath);
    fs.rmSync(invalidPath, { recursive: true, force: true });
  }
}

function main() {
  console.log("Initializing PACT workspace...\n");

  ensureDir(path.join(ROOT, "notebooks"));
  ensureDir(path.join(ROOT, "artifacts", "responses"));
  ensureDir(path.join(ROOT, "scripts"));

  removeInvalidStructures();

  createNotebook("notebook-1");
  createNotebook("notebook-2");

  console.log("\nPACT structure ready.");
}

main();