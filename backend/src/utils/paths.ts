import path from 'path'

/**
 * Scratch directory for generated print artefacts.
 *
 * Resolved from this file's location rather than process.cwd(): the server is
 * normally started from the backend/ directory, so joining cwd with 'backend'
 * produced backend/backend/scratch and the static route never matched the files
 * the print processor actually wrote.
 *
 * Layout is the same for ts-node (src/utils) and the compiled build (dist/utils).
 */
export const SCRATCH_DIR =
  process.env.SCRATCH_DIR || path.resolve(__dirname, '..', '..', 'scratch')
