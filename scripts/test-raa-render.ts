/**
 * Smoke test for the RAA renderer + generator.
 *
 * Usage:
 *   pnpm tsx scripts/test-raa-render.ts                 # default polygon 20, DB mode
 *   pnpm tsx scripts/test-raa-render.ts 19              # polygon 19
 *   pnpm tsx scripts/test-raa-render.ts 20 fixture      # use canned fixture
 *
 * Writes the .docx to ~/Desktop/ and prints the path.
 */
import { homedir } from "node:os";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { generateRaa, type RaaSource } from "../src/lib/raa/generate";
import { raaFilename, renderRaaToBuffer } from "../src/lib/raa/render";

async function main() {
  const fid = Number(process.argv[2] ?? 20);
  const source = (process.argv[3] ?? "db") as RaaSource;
  const raa = await generateRaa({ polygonFid: fid, source });
  const buf = await renderRaaToBuffer(raa);
  const filename = raaFilename(raa.polygonFid, raa.meta?.weekIso);
  const path = join(homedir(), "Desktop", filename);
  writeFileSync(path, buf);
  console.log(`✅ ${path} (${buf.byteLength} bytes, source=${source})`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
