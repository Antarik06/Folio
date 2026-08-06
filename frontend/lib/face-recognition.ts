'use client'

/**
 * Browser-side face embedding extraction.
 *
 * Runs face-api.js (SSD MobileNet v1 → 68-point landmarks → FaceNet recogniser)
 * on the WebGL backend and hands the resulting 128-float descriptors to the
 * backend, which owns matching and storage. It lives in the browser rather than
 * on the Express server for two reasons: every photo already passes through the
 * client on its way to Supabase storage, and the only Node TensorFlow binding
 * that would make server inference practical needs a native build the deploy
 * target does not have.
 *
 * Everything here is dynamically imported so the ~1 MB library and ~12 MB of
 * weights never enter the initial bundle — they load the first time someone
 * actually uploads a photo or enrolls a face.
 */

export interface DetectedFace {
  descriptor: number[]
  box: { x: number; y: number; width: number; height: number }
  score: number
}

export type FaceEngineStatus = 'idle' | 'loading' | 'ready' | 'unavailable'

const MODEL_URL = '/models/face-api'

/** Below this the detection is more likely noise than a face. */
const MIN_DETECTION_SCORE = 0.5

/**
 * Long edge the image is scaled to before detection. Full-resolution event
 * photos are 4000px+; downscaling costs no accuracy at this model's input size
 * and turns a multi-second detection into a few hundred milliseconds.
 */
const DETECTION_MAX_EDGE = 1024

type FaceApi = typeof import('@vladmandic/face-api')

/**
 * face-api re-exports the whole of tfjs at runtime, but its bundled .d.ts only
 * declares the handful of ops the library itself calls — backend selection is
 * missing from the type even though it is present on the object.
 */
interface TfBackendControls {
  setBackend(backend: string): Promise<boolean>
  ready(): Promise<void>
  getBackend(): string
}

let loadPromise: Promise<FaceApi> | null = null
let engineStatus: FaceEngineStatus = 'idle'

export function getFaceEngineStatus(): FaceEngineStatus {
  return engineStatus
}

/**
 * Loads the library and its three nets exactly once per page.
 * Concurrent callers share the same promise.
 */
export function loadFaceEngine(): Promise<FaceApi> {
  if (loadPromise) return loadPromise

  engineStatus = 'loading'
  loadPromise = (async () => {
    const faceapi = await import('@vladmandic/face-api')

    // WebGL is an order of magnitude faster than the CPU fallback, but it is
    // unavailable in some embedded webviews — let tfjs fall back rather than
    // failing outright.
    const tf = faceapi.tf as unknown as TfBackendControls
    try {
      await tf.setBackend('webgl')
    } catch {
      await tf.setBackend('cpu')
    }
    await tf.ready()

    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ])

    engineStatus = 'ready'
    return faceapi
  })().catch((err) => {
    // Reset so a later attempt can retry (e.g. the weights 404'd because the
    // setup script had not run yet).
    engineStatus = 'unavailable'
    loadPromise = null
    throw err
  })

  return loadPromise
}

/**
 * Draws a source image onto a canvas at a detection-friendly size.
 * face-api accepts a canvas directly, which avoids a second decode.
 */
async function toDetectionCanvas(source: Blob | HTMLImageElement): Promise<HTMLCanvasElement> {
  let width: number
  let height: number
  let draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
  let cleanup: (() => void) | undefined

  if (source instanceof Blob) {
    const bitmap = await createImageBitmap(source)
    width = bitmap.width
    height = bitmap.height
    draw = (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h)
    cleanup = () => bitmap.close?.()
  } else {
    width = source.naturalWidth || source.width
    height = source.naturalHeight || source.height
    draw = (ctx, w, h) => ctx.drawImage(source, 0, 0, w, h)
  }

  if (!width || !height) {
    cleanup?.()
    throw new Error('Image has no decodable dimensions.')
  }

  try {
    const scale = Math.min(1, DETECTION_MAX_EDGE / Math.max(width, height))
    const targetW = Math.max(1, Math.round(width * scale))
    const targetH = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = targetW
    canvas.height = targetH
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not initialize canvas context')
    draw(ctx, targetW, targetH)
    return canvas
  } finally {
    cleanup?.()
  }
}

/**
 * Detects every face in an image and returns their embeddings.
 * Boxes are normalised to 0-1 so they stay meaningful regardless of the
 * downscale applied above.
 */
export async function detectFaces(source: Blob | HTMLImageElement): Promise<DetectedFace[]> {
  const faceapi = await loadFaceEngine()
  const canvas = await toDetectionCanvas(source)

  const results = await faceapi
    .detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options({ minConfidence: MIN_DETECTION_SCORE }))
    .withFaceLandmarks()
    .withFaceDescriptors()

  return results.map((result) => ({
    descriptor: Array.from(result.descriptor),
    box: {
      x: result.detection.box.x / canvas.width,
      y: result.detection.box.y / canvas.height,
      width: result.detection.box.width / canvas.width,
      height: result.detection.box.height / canvas.height,
    },
    score: result.detection.score,
  }))
}

/**
 * Enrollment variant: returns the single most prominent face, or null.
 * A selfie with two faces in frame would otherwise enroll whichever the model
 * happened to list first.
 */
export async function detectEnrollmentFace(source: Blob | HTMLImageElement): Promise<DetectedFace | null> {
  const faces = await detectFaces(source)
  if (faces.length === 0) return null

  return faces.reduce((largest, face) =>
    face.box.width * face.box.height > largest.box.width * largest.box.height ? face : largest
  )
}

/** Human-readable reason an enrollment selfie was rejected, or null if it is fine. */
export function describeEnrollmentProblem(faces: DetectedFace[]): string | null {
  if (faces.length === 0) {
    return "We couldn't find a face in that photo. Find brighter light, remove sunglasses, and keep your face centred."
  }
  if (faces.length > 1) {
    return 'We found more than one face. Retake the selfie with only you in the frame.'
  }
  const face = faces[0]
  // A face occupying under ~8% of the frame width yields a noticeably weaker
  // embedding, which shows up later as missed matches.
  if (face.box.width < 0.08) {
    return 'Your face is too small in the frame. Hold the camera closer and try again.'
  }
  return null
}
