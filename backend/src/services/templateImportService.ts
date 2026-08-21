import { parseIDML } from '../utils/idmlParser'
import { HttpError } from '../utils/httpError'

/**
 * Importing an artist's page layout from a design tool.
 *
 * Two formats reach the app: Adobe InDesign IDML (parsed here) and Photoshop
 * PSD (parsed in the browser by lib/psd-parser, because ag-psd needs a canvas).
 * This service is the server-side half, and the place any third format would
 * be added — the parse call used to sit inline in routes/artistRoutes.ts,
 * which is how IDML ended up undocumented and unmentioned in the architecture.
 *
 * Note for whoever picks this up next: Cleanup.md flags IDML as a candidate
 * for removal, on the grounds it may not be load-bearing. It is still wired to
 * a live route, so it stays until someone confirms no artist relies on it.
 */

/** IDML files are ZIP containers; a real one always starts with "PK". */
const ZIP_MAGIC = Buffer.from([0x50, 0x4b])

/**
 * A base64 IDML payload is held fully in memory to be unzipped, so the size is
 * capped well below the 10 MB express body limit.
 */
const MAX_IDML_BYTES = 8 * 1024 * 1024

export const templateImportService = {
  /**
   * Parses an uploaded IDML file into the layout schema the template editor
   * consumes.
   */
  async parseIdmlUpload(base64Data: string, templateId?: string) {
    if (!base64Data || typeof base64Data !== 'string') {
      throw new HttpError(400, 'Base64 IDML data is required.')
    }

    let buffer: Buffer
    try {
      buffer = Buffer.from(base64Data, 'base64')
    } catch {
      throw new HttpError(400, 'IDML data is not valid base64.')
    }

    if (buffer.length === 0) {
      throw new HttpError(400, 'IDML data is empty.')
    }
    if (buffer.length > MAX_IDML_BYTES) {
      throw new HttpError(
        413,
        `IDML file is too large. The limit is ${Math.round(MAX_IDML_BYTES / (1024 * 1024))}MB.`
      )
    }
    if (!buffer.subarray(0, 2).equals(ZIP_MAGIC)) {
      throw new HttpError(400, 'That file is not an IDML package.')
    }

    try {
      return await parseIDML(buffer, templateId || 'parsed_idml')
    } catch (err: any) {
      // The parser throws on malformed packages, which is a bad upload rather
      // than a server fault — surface it as a 400.
      throw new HttpError(400, err?.message || 'Could not read that IDML file.')
    }
  },
}
