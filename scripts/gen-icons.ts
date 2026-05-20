// Generates PWA app icons referenced by public/manifest.webmanifest.
// Run: pnpm tsx scripts/gen-icons.ts
import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";

// Emerald background (matches --primary #008757) + white barbell.
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#00a064"/>
      <stop offset="1" stop-color="#00643f"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="220" fill="url(#g)"/>
  <!-- Barbell: two end blocks + a connecting bar -->
  <g fill="#ffffff">
    <rect x="170" y="380" width="100" height="264" rx="32"/>
    <rect x="110" y="430" width="80"  height="164" rx="26"/>
    <rect x="754" y="380" width="100" height="264" rx="32"/>
    <rect x="834" y="430" width="80"  height="164" rx="26"/>
    <rect x="240" y="478" width="544" height="68"  rx="24"/>
  </g>
</svg>`;

async function make(size: number, out: string) {
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(path.resolve("public", out), buf);
  console.log(`✓ public/${out} (${size}×${size})`);
}

async function main() {
  await make(192, "icon-192.png");
  await make(512, "icon-512.png");
  await make(180, "apple-icon.png"); // iOS home-screen
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
