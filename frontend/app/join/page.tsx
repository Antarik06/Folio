'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QrCode } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Scanner } from '@yudiel/react-qr-scanner'

export default function JoinPage() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = code.trim().toUpperCase()
    if (!trimmed || trimmed.length < 4) {
      setError('Please enter a valid invite code.')
      return
    }
    router.push(`/join/${trimmed}`)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="inline-block mb-12">
          <span className="font-serif text-2xl tracking-tight text-foreground">Folio</span>
        </Link>

        <h1 className="font-serif text-4xl text-foreground mb-3">Join an Event</h1>
        <p className="text-muted-foreground mb-10">
          Enter the invite code shared by your event host to access the photo collection.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-terracotta/10 border border-terracotta/30 text-terracotta text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="invite-code"
              className="block text-sm font-sans uppercase tracking-wider text-muted-foreground mb-2"
            >
              Invite Code
            </label>
            <input
              id="invite-code"
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setError(null)
              }}
              maxLength={12}
              placeholder="e.g. A1B2C3D4"
              className="w-full px-4 py-4 bg-card border border-border text-foreground text-center text-2xl font-mono tracking-[0.3em] placeholder:text-muted-foreground/30 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary transition-colors uppercase"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground py-4 text-sm font-sans uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors"
            >
              Join Event →
            </button>
            
            <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex-none bg-card border border-border text-foreground px-6 py-4 hover:border-primary/50 hover:bg-primary/5 transition-colors group"
                  title="Scan QR Code"
                >
                  <QrCode className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md p-6">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl mb-4">Scan QR Code</DialogTitle>
                </DialogHeader>
                <div className="bg-black/5 rounded-xl overflow-hidden aspect-square relative">
                  <Scanner 
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        const url = result[0].rawValue;
                        setIsScannerOpen(false);
                        try {
                          const parsedUrl = new URL(url);
                          const pathParts = parsedUrl.pathname.split('/');
                          const extractedCode = pathParts[pathParts.length - 1];
                          if (extractedCode) {
                            setCode(extractedCode);
                            router.push(`/join/${extractedCode}`);
                          } else {
                            setError('Invalid QR code format.');
                          }
                        } catch(e) {
                          setCode(url);
                          router.push(`/join/${url}`);
                        }
                      }
                    }} 
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground mt-4">
                  Point your camera at the event's QR code.
                </p>
              </DialogContent>
            </Dialog>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Have a direct invite link? Just click it — it will bring you here automatically.
        </p>
      </div>
    </main>
  )
}
