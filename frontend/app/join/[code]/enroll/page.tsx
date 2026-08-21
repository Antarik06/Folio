'use client'

import { useCallback, useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { enrollFace } from '@/lib/actions/events'
import { detectFaces, describeEnrollmentProblem, loadFaceEngine } from '@/lib/face-recognition'
import { MonoLabel, StampButton } from '@/components/folio/primitives'
import { Loupe, SleeveReveal, type RevealPhoto } from '@/components/join/loupe'
import { CrosshairMark } from '@/components/folio/marks'

type Step = 'intro' | 'camera' | 'preview' | 'matching' | 'done'

interface EnrollFacePageProps {
  params: Promise<{ code: string }>
}

/**
 * Screen 02, cards 2–3 — Face-Match.
 *
 * Nothing here is a progress bar or a modal. The scan is an instrument closing
 * in (Loupe), and the result is a physical delivery (SleeveReveal). The camera
 * stage borrows the same registration crosses the invitation insert carries.
 */
function EnrollFaceContent({ params: paramsPromise }: EnrollFacePageProps) {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const router = useRouter()

  const [code, setCode] = useState<string>('')
  const [step, setStep] = useState<Step>('intro')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [readout, setReadout] = useState('Reading the frame…')
  const [matchedCount, setMatchedCount] = useState<number | null>(null)
  const [preview, setPreview] = useState<RevealPhoto[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    paramsPromise.then(({ code }) => setCode(code))
  }, [paramsPromise])

  // Start fetching the ~12 MB of face model weights while the guest is still
  // reading the instructions, so confirming the selfie feels instant.
  useEffect(() => {
    loadFaceEngine().catch(() => {
      // Surfaced at confirm time if it is still broken then.
    })
  }, [])

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startCamera() {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStep('camera')
    } catch {
      setCameraError('Camera is blocked. Allow camera access in your browser and try again.')
    }
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 640
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror, so the capture matches the preview the guest was looking at.
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoRef.current, 0, 0)

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.85))

    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setStep('preview')
  }, [])

  function retake() {
    setCapturedImage(null)
    startCamera()
  }

  async function confirmAndEnroll() {
    if (!capturedImage || !eventId) return
    setStep('matching')
    setUploadError(null)
    setReadout('Reading the frame…')

    try {
      const res = await fetch(capturedImage)
      const blob = await res.blob()

      // Extract the embedding first. If the selfie is unusable there is no
      // point uploading it — the guest gets told what to fix while the retake
      // button is still one tap away.
      let faces
      try {
        faces = await detectFaces(blob)
      } catch (err: any) {
        console.error('Face detection failed:', err)
        throw new Error(
          'Face recognition could not start on this device. Try a different browser, or ask the host to add your photos manually.'
        )
      }

      const problem = describeEnrollmentProblem(faces)
      if (problem) throw new Error(problem)

      setReadout('Filing your reference…')

      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const filePath = `${user.id}/${eventId}.jpg`
      const { error: storageError } = await supabase.storage
        .from('face-photos')
        .upload(filePath, file, { upsert: true })

      if (storageError) throw storageError

      const {
        data: { publicUrl },
      } = supabase.storage.from('face-photos').getPublicUrl(filePath)

      setReadout('Matching against the sheet…')

      const result = await enrollFace(eventId, publicUrl, faces[0].descriptor)
      if (result?.error) throw new Error(result.error)

      setMatchedCount(typeof result?.matched === 'number' ? result.matched : null)
      setPreview(Array.isArray(result?.preview) ? result.preview : [])
      setStep('done')
    } catch (err: any) {
      setUploadError(err.message || 'Something went wrong. Try again.')
      setStep('preview')
    }
  }

  if (!eventId) {
    return (
      <Shell>
        <MonoLabel className="text-center">Invalid enrollment link</MonoLabel>
      </Shell>
    )
  }

  return (
    <Shell>
      {step === 'intro' ? (
        <div>
          <MonoLabel tone="primary" size="xs" className="mb-3">
            Finding you
          </MonoLabel>
          <h1 className="font-serif text-[clamp(1.75rem,8vw,2.25rem)] leading-tight text-foreground">
            One selfie, and the sheet finds you
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            It stays private to this event, and it is only ever compared against
            this event&apos;s photos.
          </p>

          <ol className="mt-7 space-y-3 border-y border-border py-5">
            {[
              'Face a window, or any bright light',
              'Keep your face centred and clear',
              'Take off sunglasses and anything covering your face',
            ].map((tip, i) => (
              <li key={tip} className="flex items-start gap-3">
                <span className="mt-0.5 font-mono text-[11px] text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-sm text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ol>

          {cameraError ? <ErrorNote>{cameraError}</ErrorNote> : null}

          <div className="mt-7 space-y-3">
            <StampButton tone="primary" onClick={startCamera} className="w-full">
              Open camera →
            </StampButton>
            <StampButton
              href={`/photos/events/${eventId}/me`}
              tone="ghost"
              className="w-full"
            >
              Skip for now
            </StampButton>
          </div>
        </div>
      ) : null}

      {step === 'camera' ? (
        <div>
          <MonoLabel tone="primary" size="xs" className="mb-3">
            Registering
          </MonoLabel>
          <h1 className="font-serif text-2xl text-foreground">Line yourself up</h1>

          <div className="relative mt-5 aspect-square w-full overflow-hidden border border-border bg-foreground">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
              <div className="h-[62%] w-[46%] rounded-full border-2 border-primary/60" />
            </div>
            <div className="pointer-events-none absolute left-3 top-3 z-10">
              <CrosshairMark size={16} color="#F5F0E8" opacity={0.5} />
            </div>
            <div className="pointer-events-none absolute right-3 top-3 z-10">
              <CrosshairMark size={16} color="#F5F0E8" opacity={0.5} />
            </div>
            <div className="pointer-events-none absolute bottom-3 left-3 z-10">
              <CrosshairMark size={16} color="#F5F0E8" opacity={0.5} />
            </div>
            <div className="pointer-events-none absolute bottom-3 right-3 z-10">
              <CrosshairMark size={16} color="#F5F0E8" opacity={0.5} />
            </div>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>

          <div className="mt-5 space-y-3">
            <StampButton tone="primary" onClick={capturePhoto} className="w-full">
              Capture
            </StampButton>
            <StampButton
              tone="ghost"
              onClick={() => {
                streamRef.current?.getTracks().forEach((t) => t.stop())
                setStep('intro')
              }}
              className="w-full"
            >
              Cancel
            </StampButton>
          </div>
        </div>
      ) : null}

      {step === 'preview' && capturedImage ? (
        <div>
          <MonoLabel tone="primary" size="xs" className="mb-3">
            Proof
          </MonoLabel>
          <h1 className="font-serif text-2xl text-foreground">Usable?</h1>

          <div className="mt-5 aspect-square w-full overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Your selfie"
              className="h-full w-full object-cover"
            />
          </div>

          {uploadError ? <ErrorNote>{uploadError}</ErrorNote> : null}

          <div className="mt-5 space-y-3">
            <StampButton tone="primary" onClick={confirmAndEnroll} className="w-full">
              Use this one
            </StampButton>
            <StampButton tone="ghost" onClick={retake} className="w-full">
              Retake
            </StampButton>
          </div>
        </div>
      ) : null}

      {step === 'matching' ? (
        <Loupe src={capturedImage} caption="Finding you" readout={readout} />
      ) : null}

      {step === 'done' ? (
        <div>
          {preview.length > 0 && matchedCount ? (
            <SleeveReveal
              photos={preview}
              headline={`${matchedCount} photo${matchedCount === 1 ? '' : 's'} found you`}
              caption="More arrive as the host uploads"
            />
          ) : (
            <div className="rounded-[4px] border-[1.5px] border-border bg-card px-5 py-9 text-center">
              <MonoLabel tone="secondary" size="xs" className="mb-3">
                Reference filed
              </MonoLabel>
              <h2 className="font-serif text-2xl text-foreground">
                {matchedCount === 0 ? 'Nothing matches yet' : "You're enrolled"}
              </h2>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                New photos are matched to you as the host uploads them, so check
                back during and after the event.
              </p>
            </div>
          )}

          <div className="mt-5 space-y-3">
            <StampButton
              tone="primary"
              onClick={() => router.push(`/photos/events/${eventId}/me`)}
              className="w-full"
            >
              Photos of me →
            </StampButton>
            <StampButton
              href={`/photos/events/${eventId}`}
              tone="ghost"
              className="w-full"
            >
              Open the whole event
            </StampButton>
          </div>
        </div>
      ) : null}

      {code ? (
        <MonoLabel size="xs" className="mt-6 text-center">
          Code {code.toUpperCase()}
        </MonoLabel>
      ) : null}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[100dvh] bg-background">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-5 py-10 safe-bottom">
        <Link
          href="/"
          className="mb-8 inline-flex min-h-[44px] items-center self-center"
          aria-label="Folio home"
        >
          <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
        </Link>
        {children}
      </div>
    </main>
  )
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 border border-primary px-3 py-2.5 text-sm leading-relaxed text-primary">
      {children}
    </p>
  )
}

export default function EnrollFacePage({ params }: EnrollFacePageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center bg-background">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-soft">
            Loading…
          </span>
        </main>
      }
    >
      <EnrollFaceContent params={params} />
    </Suspense>
  )
}
