import { readFileSync, writeFileSync } from "node:fs";

const commitMessagePath = process.argv[2];
if (!commitMessagePath) {
  process.exit(0);
}

const message = readFileSync(commitMessagePath, "utf8");
const cleaned = message
  .split("\n")
  .filter((line) => {
    const trimmed = line.trim();
    if (/^co-authored-by:\s*cursor\b/i.test(trimmed)) {
      return false;
    }
    if (/cursoragent@cursor\.com/i.test(trimmed)) {
      return false;
    }
    if (/^made-with:\s*cursor\b/i.test(trimmed)) {
      return false;
    }
    return true;
  })
  .join("\n")
  .replace(/\n{3,}/g, "\n\n")
  .replace(/\s+$/, "")
  .concat("\n");

writeFileSync(commitMessagePath, cleaned);
