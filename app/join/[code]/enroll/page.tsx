'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { enrollFace } from '@/lib/actions/events'

type Step = 'intro' | 'camera' | 'preview' | 'uploading' | 'done'

interface EnrollFacePageProps {
  params: Promise<{ code: string }>
}

export default function EnrollFacePage({ params: paramsPromise }: EnrollFacePageProps) {
  const searchParams = useSearchParams()
  const eventId = searchParams.get('event') ?? ''
  const router = useRouter()

  const [code, setCode] = useState<string>('')
  const [step, setStep] = useState<Step>('intro')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Resolve params
  useEffect(() => {
    paramsPromise.then(({ code }) => setCode(code))
  }, [paramsPromise])

  // Stop camera stream on unmount
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
      setCameraError(
        'Unable to access camera. Please allow camera permission and try again.'
      )
    }
  }

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth || 640
    canvas.height = videoRef.current.videoHeight || 640
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Mirror for selfie feel
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(videoRef.current, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedImage(dataUrl)

    // Stop camera
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
    setStep('uploading')
    setUploadError(null)

    try {
      // Convert dataUrl → Blob
      const res = await fetch(capturedImage)
      const blob = await res.blob()
      const file = new File([blob], `selfie-${Date.now()}.jpg`, { type: 'image/jpeg' })

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const filePath = `${user.id}/${eventId}.jpg`
      const { error: uploadError } = await supabase.storage
        .from('face-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('face-photos')
        .getPublicUrl(filePath)

      const result = await enrollFace(eventId, publicUrl)
      if (result?.error) throw new Error(result.error)

      setStep('done')
    } catch (err: any) {
      setUploadError(err.message || 'Something went wrong. Please try again.')
      setStep('preview')
    }
  }

  if (!eventId) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-foreground">Invalid enrollment link.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-block mb-10">
          <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
        </Link>

        {/* Step: Intro */}
        {step === 'intro' && (
          <div>
            <div className="w-16 h-16 border border-secondary flex items-center justify-center mb-8">
              <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl text-foreground mb-3">Enroll your face</h1>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Take a quick selfie so our AI can identify you in event photos and build your personalized album automatically.
            </p>

            <div className="space-y-3 mb-10">
              {[
                'Find good lighting — face a window or bright light',
                'Keep your face centred and clearly visible',
                'Remove sunglasses or anything covering your face',
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="font-mono text-xs text-muted-foreground mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>

            {cameraError && (
              <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
                {cameraError}
              </div>
            )}

            <button
              onClick={startCamera}
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors mb-4"
            >
              Open Camera →
            </button>
            <Link
              href={`/events/${eventId}/my-photos`}
              className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip for now
            </Link>
          </div>
        )}

        {/* Step: Camera */}
        {step === 'camera' && (
          <div>
            <h1 className="font-serif text-3xl text-foreground mb-2">Position your face</h1>
            <p className="text-sm text-muted-foreground mb-6">Centre your face within the frame, then tap capture.</p>

            {/* Camera preview */}
            <div className="relative w-full aspect-square bg-ink overflow-hidden mb-6">
              {/* Oval face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="w-48 h-64 border-2 border-primary/60 rounded-full opacity-70" />
              </div>
              {/* Corner guides */}
              <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-primary/40 z-10" />
              <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-primary/40 z-10" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-primary/40 z-10" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-primary/40 z-10" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: 'scaleX(-1)' }}
              />
            </div>

            <button
              onClick={capturePhoto}
              className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors mb-4"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capture Selfie
            </button>
            <button
              onClick={() => {
                streamRef.current?.getTracks().forEach((t) => t.stop())
                setStep('intro')
              }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Step: Preview */}
        {step === 'preview' && capturedImage && (
          <div>
            <h1 className="font-serif text-3xl text-foreground mb-2">Looking good?</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Make sure your face is clearly visible. You can retake if needed.
            </p>

            <div className="w-full aspect-square overflow-hidden mb-6 border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={capturedImage} alt="Your selfie" className="w-full h-full object-cover" />
            </div>

            {uploadError && (
              <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
                {uploadError}
              </div>
            )}

            <button
              onClick={confirmAndEnroll}
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors mb-4"
            >
              Looks Good — Enroll
            </button>
            <button
              onClick={retake}
              className="w-full border border-border text-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-card transition-colors"
            >
              Retake
            </button>
          </div>
        )}

        {/* Step: Uploading */}
        {step === 'uploading' && (
          <div className="text-center">
            <div className="w-16 h-16 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-8" />
            <h1 className="font-serif text-3xl text-foreground mb-3">Enrolling your face...</h1>
            <p className="text-muted-foreground text-sm">This only takes a moment.</p>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && (
          <div>
            <div className="w-16 h-16 border border-secondary flex items-center justify-center mb-8">
              <svg className="w-8 h-8 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-serif text-4xl text-foreground mb-4">You&apos;re enrolled!</h1>
            <p className="text-muted-foreground mb-3 leading-relaxed">
              Your face has been registered. AI will now match event photos to you and build your personalized album.
            </p>
            <p className="text-sm text-muted-foreground mb-10">
              It may take a little while for photos to be matched — check back after a few minutes.
            </p>

            <button
              onClick={() => router.push(`/events/${eventId}/my-photos`)}
              className="w-full bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
            >
              View My Photos →
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
