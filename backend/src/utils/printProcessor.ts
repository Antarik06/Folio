import { query } from '../db'
import { supabaseAdmin } from './supabaseClient'
import { getRelativePath } from './storage'
import { SCRATCH_DIR } from './paths'
import sharp from 'sharp'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

const SPREAD_WIDTH = 700
const SPREAD_HEIGHT = 1000

// Helper to convert hex colors to PDF-lib rgb
function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0
  return rgb(r, g, b)
}

// Draw crop marks at corners
function drawCropMarks(page: any, width: number, height: number, bleed: number, margin: number) {
  const trimLeft = margin + bleed
  const trimRight = margin + bleed + width
  const trimBottom = margin + bleed
  const trimTop = margin + bleed + height
  
  const lineLength = 15
  const lineOffset = 3
  
  // Bottom-Left
  page.drawLine({ start: { x: trimLeft - lineLength - lineOffset, y: trimBottom }, end: { x: trimLeft - lineOffset, y: trimBottom }, thickness: 0.5 })
  page.drawLine({ start: { x: trimLeft, y: trimBottom - lineLength - lineOffset }, end: { x: trimLeft, y: trimBottom - lineOffset }, thickness: 0.5 })
  
  // Bottom-Right
  page.drawLine({ start: { x: trimRight + lineOffset, y: trimBottom }, end: { x: trimRight + lineLength + lineOffset, y: trimBottom }, thickness: 0.5 })
  page.drawLine({ start: { x: trimRight, y: trimBottom - lineLength - lineOffset }, end: { x: trimRight, y: trimBottom - lineOffset }, thickness: 0.5 })
  
  // Top-Left
  page.drawLine({ start: { x: trimLeft - lineLength - lineOffset, y: trimTop }, end: { x: trimLeft - lineOffset, y: trimTop }, thickness: 0.5 })
  page.drawLine({ start: { x: trimLeft, y: trimTop + lineOffset }, end: { x: trimLeft, y: trimTop + lineLength + lineOffset }, thickness: 0.5 })
  
  // Top-Right
  page.drawLine({ start: { x: trimRight + lineOffset, y: trimTop }, end: { x: trimRight + lineLength + lineOffset, y: trimTop }, thickness: 0.5 })
  page.drawLine({ start: { x: trimRight, y: trimTop + lineOffset }, end: { x: trimRight, y: trimTop + lineLength + lineOffset }, thickness: 0.5 })
}

async function convertToPdfX4(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    const cmd = `gs -dPDFX -dBATCH -dNOPAUSE -sDEVICE=pdfwrite -sColorConversionStrategy=CMYK -sPDFXCompatibilityPolicy=1 -sOutputFile="${outputPath}" "${inputPath}"`
    await execPromise(cmd)
    return true
  } catch (err) {
    return false
  }
}

export async function processPrintJob(orderId: string, logCallback: (msg: string) => void): Promise<{ pdfPath: string, report: any }> {
  logCallback(`Starting print job for order ${orderId}`)
  
  // 1. Fetch order details
  const orderRes = await query('SELECT * FROM public.orders WHERE id = $1', [orderId])
  const order = orderRes.rows[0]
  if (!order) {
    throw new Error(`Order ${orderId} not found`)
  }

  // Derive size dimensions
  const productType = order.product_type || 'softcover_small'
  let widthMm = 150
  let heightMm = 150

  if (productType.includes('large')) {
    widthMm = 300
    heightMm = 300
  } else if (productType.includes('polaroid')) {
    widthMm = 107
    heightMm = 88
  }

  logCallback(`Product type: ${productType}, Page size: ${widthMm}x${heightMm}mm`)

  // Margins, Bleeds
  const bleedMm = 3
  const marginMm = 5 // spacing around page for crop marks

  // Convert to points
  const pointsPerMm = 72 / 25.4
  const pageWidthPoints = widthMm * pointsPerMm
  const pageHeightPoints = heightMm * pointsPerMm
  const bleedPoints = bleedMm * pointsPerMm
  const marginPoints = marginMm * pointsPerMm

  // PDF page physical size: pageWidthPoints + 2 * (bleedPoints + marginPoints)
  const physicalWidth = pageWidthPoints + 2 * (bleedPoints + marginPoints)
  const physicalHeight = pageHeightPoints + 2 * (bleedPoints + marginPoints)

  // 2. Parse layouts
  let layout = order.album_layout_json
  if (typeof layout === 'string') {
    layout = JSON.parse(layout)
  }

  const spreads = layout?.spreads || []
  if (spreads.length === 0) {
    throw new Error('No spreads found in album layout')
  }

  logCallback(`Found ${spreads.length} spreads in layout`)

  // Create PDF
  const pdfDoc = await PDFDocument.create()
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Tracked so the preflight report shows when artwork silently fell back to
  // placeholder boxes instead of reporting a clean success.
  let imagesEmbedded = 0
  let imagesFailed = 0

  // Scale factors from Konva coordinate space (700x1000) to points
  const scaleX = pageWidthPoints / SPREAD_WIDTH
  const scaleY = pageHeightPoints / SPREAD_HEIGHT

  // Process pages
  for (let sIdx = 0; sIdx < spreads.length; sIdx++) {
    const spread = spreads[sIdx]
    logCallback(`Processing spread ${sIdx + 1}/${spreads.length}`)

    // A spread has front and back sides (left and right pages)
    const pageSides: { name: string; elements: any[]; background: string }[] = []
    
    if (spread.isCover) {
      if (spread.front?.elements) {
        pageSides.push({ name: 'Cover Front', elements: spread.front.elements, background: spread.front.background || '#FAF9F6' })
      } else if (spread.elements) {
        pageSides.push({ name: 'Cover Front', elements: spread.elements, background: spread.background || '#FAF9F6' })
      }
    } else {
      if (spread.front?.elements) {
        pageSides.push({ name: `Spread ${sIdx} Left`, elements: spread.front.elements, background: spread.front.background || '#FFFFFF' })
      }
      if (spread.back?.elements) {
        pageSides.push({ name: `Spread ${sIdx} Right`, elements: spread.back.elements, background: spread.back.background || '#FFFFFF' })
      }
    }

    for (const side of pageSides) {
      logCallback(`Adding page: ${side.name}`)
      const page = pdfDoc.addPage([physicalWidth, physicalHeight])
      
      // Set PDF page boxes
      page.setMediaBox(0, 0, physicalWidth, physicalHeight)
      page.setBleedBox(marginPoints, marginPoints, pageWidthPoints + 2 * bleedPoints, pageHeightPoints + 2 * bleedPoints)
      page.setTrimBox(marginPoints + bleedPoints, marginPoints + bleedPoints, pageWidthPoints, pageHeightPoints)

      // Draw background color
      const bgColor = hexToRgb(side.background)
      page.drawRectangle({
        x: marginPoints + bleedPoints,
        y: marginPoints + bleedPoints,
        width: pageWidthPoints,
        height: pageHeightPoints,
        color: bgColor
      })

      // Draw crop marks
      drawCropMarks(page, pageWidthPoints, pageHeightPoints, bleedPoints, marginPoints)

      // Draw elements
      for (const el of side.elements || []) {
        // Compute coordinates
        const pdfX = marginPoints + bleedPoints + (el.x * scaleX)
        const pdfY = marginPoints + bleedPoints + (pageHeightPoints - (el.y * scaleY) - (el.height * scaleY))
        const elW = el.width * scaleX
        const elH = el.height * scaleY

        if (el.type === 'image' && el.src) {
          logCallback(`Processing image slot: ${el.name || el.id}`)
          try {
            // Get private bucket path
            const relativePath = getRelativePath(el.src)
            if (!relativePath) {
              logCallback(`Warning: invalid relative path for image url: ${el.src}`)
              continue
            }

            // Download from storage bucket
            const { data: fileBlob, error: downloadErr } = await supabaseAdmin.storage
              .from('photos')
              .download(relativePath)

            if (downloadErr || !fileBlob) {
              throw downloadErr || new Error('Empty file blob')
            }

            // Read blob into buffer
            const arrayBuffer = await fileBlob.arrayBuffer()
            const imgBuffer = Buffer.from(arrayBuffer)

            // Crop & convert using sharp
            let processed = sharp(imgBuffer, { failOn: 'none' }).rotate()
            if (el.crop) {
              const meta = await processed.metadata()
              const imgW = meta.width || 0
              const imgH = meta.height || 0
              if (imgW && imgH) {
                const left = Math.max(0, Math.round((el.crop.x || 0) * imgW))
                const top = Math.max(0, Math.round((el.crop.y || 0) * imgH))
                const width = Math.round((el.crop.width || 1) * imgW)
                const height = Math.round((el.crop.height || 1) * imgH)
                if (width > 0 && height > 0 && left + width <= imgW && top + height <= imgH) {
                  processed = processed.extract({ left, top, width, height })
                }
              }
            }

            // Encode as a baseline RGB JPEG. Two things were wrong before:
            // toBuffer() without a format kept the source encoding (a PNG would
            // then be handed to embedJpg), and pdf-lib cannot embed CMYK JPEGs
            // at all — so every image fell through to the placeholder box.
            // Ghostscript performs the CMYK conversion later, during the PDF/X-4
            // step, which is the correct place for it.
            const outBuffer = await processed
              .toColourspace('srgb')
              .jpeg({ quality: 92, chromaSubsampling: '4:4:4', mozjpeg: false })
              .toBuffer()

            // Embed & Draw
            const embeddedImg = await pdfDoc.embedJpg(outBuffer)
            page.drawImage(embeddedImg, {
              x: pdfX,
              y: pdfY,
              width: elW,
              height: elH
            })
            imagesEmbedded++
            logCallback(`Successfully rendered image: ${el.name || el.id}`)
          } catch (imgErr: any) {
            imagesFailed++
            logCallback(`Error processing image ${el.id}: ${imgErr.message}`)
            // Fallback: draw placeholder box
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: elW,
              height: elH,
              color: rgb(0.9, 0.9, 0.9)
            })
            page.drawText('Image Missing', {
              x: pdfX + 10,
              y: pdfY + elH / 2,
              size: 10,
              font: helveticaFont,
              color: rgb(0.5, 0.5, 0.5)
            })
          }
        } else if (el.type === 'text' && el.text) {
          logCallback(`Drawing text: ${el.text}`)
          const fontSize = (el.fontSize || 12) * scaleY
          // drawText positions the baseline of the first line, while element
          // coordinates describe the top-left of the text box. Without this
          // offset every text block sat one box-height too low.
          const baselineY = pdfY + elH - fontSize
          page.drawText(el.text, {
            x: pdfX,
            y: baselineY,
            size: fontSize,
            lineHeight: fontSize * 1.2,
            maxWidth: elW,
            font: helveticaFont,
            color: hexToRgb(el.fill || '#000000')
          })
        }
      }
    }
  }

  // 3. Save PDF locally, then attempt PDF/X-4 GS compilation
  const pdfBytes = await pdfDoc.save()
  const tempDir = SCRATCH_DIR
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const rawPath = path.join(tempDir, `raw_${orderId}.pdf`)
  const compiledPath = path.join(tempDir, `print_${orderId}.pdf`)

  fs.writeFileSync(rawPath, pdfBytes)
  logCallback(`Saved raw PDF to temp folder`)

  // Ghostscript conversion
  let finalBytes = pdfBytes
  let preflightSuccess = false
  let gsMessage = 'Bypassed'

  try {
    const gsOk = await convertToPdfX4(rawPath, compiledPath)
    if (gsOk && fs.existsSync(compiledPath)) {
      finalBytes = fs.readFileSync(compiledPath)
      preflightSuccess = true
      gsMessage = 'Successfully compiled to PDF/X-4'
      logCallback(gsMessage)
    } else {
      logCallback('Ghostscript failed or bypassed, utilizing standard PDF-lib format')
    }
  } catch (gsErr: any) {
    logCallback(`Ghostscript error: ${gsErr.message}`)
  }

  // Keep the final PDF locally in the scratch folder as fallback/download
  const localPublishPath = path.join(tempDir, `print_${orderId}.pdf`)
  fs.writeFileSync(localPublishPath, finalBytes)
  logCallback(`Saved compiled PDF locally to scratch folder as backup`)

  // Cleanup raw temp file
  try {
    if (fs.existsSync(rawPath)) fs.unlinkSync(rawPath)
  } catch (cleanErr) {
    // ignore
  }

  // 4. Upload finished PDF to Supabase Storage with octet-stream
  const storagePath = `print-ready/${orderId}.pdf`
  let pdfUrl = ''

  try {
    logCallback(`Uploading finished PDF to storage: ${storagePath}`)
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('photos')
      .upload(storagePath, finalBytes, {
        contentType: 'application/octet-stream',
        upsert: true
      })

    if (uploadErr) {
      throw uploadErr
    }

    const { data: urlData } = supabaseAdmin.storage.from('photos').getPublicUrl(storagePath)
    pdfUrl = urlData.publicUrl
    logCallback(`Uploaded successfully to bucket: ${pdfUrl}`)
    
    // Cleanup local backup since upload succeeded
    try {
      if (fs.existsSync(localPublishPath)) fs.unlinkSync(localPublishPath)
    } catch (e) {}
  } catch (err: any) {
    logCallback(`Storage upload failed: ${err.message}. Falling back to local static URL.`)
    const port = process.env.PORT || 5000
    pdfUrl = `http://localhost:${port}/scratch/print_${orderId}.pdf`
  }

  logCallback(`Print processing finished successfully`)

  return {
    pdfPath: pdfUrl,
    report: {
      success: true,
      preflight: preflightSuccess ? 'passed' : 'warning',
      ghostscript: gsMessage,
      // Real page count from the document, not spreads * 2: covers contribute
      // one page and a trailing spread may only have a front.
      pageCount: pdfDoc.getPageCount(),
      spreadCount: spreads.length,
      imagesEmbedded,
      imagesFailed,
      timestamp: new Date().toISOString()
    }
  }
}
