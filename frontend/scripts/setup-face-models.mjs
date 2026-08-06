/**
 * Copies the face-api model weights out of node_modules into public/, where the
 * browser can fetch them.
 *
 * They are not committed (see .gitignore) because they are ~12 MB of binary that
 * npm already ships with @vladmandic/face-api. This runs on postinstall and
 * again before dev/build, so a fresh clone works with no extra step.
 */
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const projectRoot = join(here, '..')
const sourceDir = join(projectRoot, 'node_modules', '@vladmandic', 'face-api', 'model')
const targetDir = join(projectRoot, 'public', 'models', 'face-api')

/**
 * Only the three nets the app actually loads: SSD MobileNet v1 (finds every
 * face in a crowded group shot, where the tiny detector misses the small ones),
 * the 68-point landmarker it needs to align crops, and the recognition net that
 * produces the 128-float embedding.
 */
const REQUIRED = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
]

if (!existsSync(sourceDir)) {
  // Not fatal: face matching degrades to "unavailable" in the UI rather than
  // breaking an install that never needed it.
  console.warn('[face-models] @vladmandic/face-api not installed; skipping model copy.')
  process.exit(0)
}

mkdirSync(targetDir, { recursive: true })

let copied = 0
let skipped = 0
for (const name of REQUIRED) {
  const from = join(sourceDir, name)
  const to = join(targetDir, name)

  if (!existsSync(from)) {
    console.warn(`[face-models] missing weight file: ${name}`)
    continue
  }

  // Re-copying 12 MB on every dev server start is wasted IO.
  if (existsSync(to) && statSync(to).size === statSync(from).size) {
    skipped++
    continue
  }

  copyFileSync(from, to)
  copied++
}

console.log(`[face-models] ${copied} copied, ${skipped} already current → public/models/face-api`)
