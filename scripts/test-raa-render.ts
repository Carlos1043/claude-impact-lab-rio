/**
 * Smoke test for the RAA renderer.
 * Run from repo root: pnpm tsx scripts/test-raa-render.ts
 * Writes a .docx to /tmp/raa-smoke.docx — open it in Word to verify.
 */
import { writeFileSync } from "node:fs";
import { presVargasFixture } from "../src/lib/raa/fixtures/pres-vargas";
import { renderRaaToBuffer } from "../src/lib/raa/render";

async function main() {
  const buf = await renderRaaToBuffer(presVargasFixture);
  const path = "/tmp/raa-smoke.docx";
  writeFileSync(path, buf);
  console.log(`✅ Wrote ${path} (${buf.byteLength} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
