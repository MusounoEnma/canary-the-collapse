// CANARY: The Collapse - make.fun Bounty (best-game-01) Entrypoint
// Psychological 3D Underground Survival Experience built with procedural Three.js
import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

console.log('[CANARY] Initializing evaluation bundle...');
console.log(`[CANARY] Source directory: ${rootDir}`);
console.log(`[CANARY] Destination directory: ${outputDir}`);

// Ensure destination directories exist
mkdirSync(outputDir, { recursive: true });
const targetGameDir = join(outputDir, 'game');
const targetScreenshotsDir = join(outputDir, 'screenshots');
mkdirSync(targetGameDir, { recursive: true });
mkdirSync(targetScreenshotsDir, { recursive: true });

// Verify required game assets
const sourceGameDir = join(rootDir, 'game');
const requiredGameFiles = ['index.html', 'js/main.js', 'js/player.js', 'js/world.js', 'js/audio.js', 'libs/three.min.js'];
for (const file of requiredGameFiles) {
  const filePath = join(sourceGameDir, file);
  if (!existsSync(filePath)) {
    console.warn(`[CANARY Warning] Expected file missing: ${file}`);
  }
}

// Copy game tree to output
console.log('[CANARY] Copying game assets into /output/game...');
cpSync(sourceGameDir, targetGameDir, { recursive: true });

// Copy verified screenshots
const sourceScreenshotsDir = join(rootDir, 'screenshots');
if (existsSync(sourceScreenshotsDir)) {
  console.log('[CANARY] Copying game screenshots into /output/screenshots...');
  cpSync(sourceScreenshotsDir, targetScreenshotsDir, { recursive: true });
  const shots = readdirSync(sourceScreenshotsDir);
  console.log(`[CANARY] Packaged ${shots.length} verified screenshots.`);
}

// Build official make.fun dossier.json
console.log('[CANARY] Generating official game dossier.json...');
const dossierConfig = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const dossierData = buildDossier(outputDir, dossierConfig);
writeFileSync(join(outputDir, 'dossier.json'), dossierData);
console.log('[CANARY] Dossier created successfully. Entry is ready for scoring.');
