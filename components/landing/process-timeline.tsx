'use client'
import { useEffect, useRef, useState } from 'react'
const steps = [
  {
    label: 'Upload',
    caption: 'Every photo has a story',
    visual: 'pile',
  },
  {
    label: 'Curate',
    caption: 'AI finds the keepers',
    visual: 'grid',
  },
  {
    label: 'Design',
    caption: 'Your narrative takes shape',
    visual: 'spread',
  },
  {
    label: 'Receive',
    caption: 'A book arrives home',
    visual: 'parcel',
    accent: true,
  },
]

export function ProcessTimeline() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 md:py-32 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-8 md:mb-0">
        The four acts
      </h2>

      <div className="hidden md:block relative">
        <div className="absolute top-8 left-0 right-0 h-px bg-border" />
        <div className="grid grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.label}
              className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="absolute top-8 left-1/2 w-px h-8 bg-border" />

              <div
                className={`mt-20 aspect-square relative border ${step.accent ? 'border-primary' : 'border-border'
                  }`}
              >
                <StepVisual type={step.visual} />
              </div>

              <p className="mt-4 font-sans text-sm text-foreground">
                {step.label}
              </p>
              <p className="mt-1 font-serif text-xs italic text-muted-foreground">
                {step.caption}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Vertical storyboard */}
      <div className="md:hidden">
        {steps.map((step, index) => (
          <div
            key={step.label}
            className={`flex gap-6 mb-8 last:mb-0 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            {/* Thumbnail */}
            <div
              className={`w-24 h-24 shrink-0 border ${step.accent ? 'border-primary' : 'border-border'
                }`}
            >
              <StepVisual type={step.visual} />
            </div>

            {/* Text */}
            <div className="flex flex-col justify-center">
              <p className="font-sans text-sm text-foreground">
                {step.label}
              </p>
              <p className="mt-1 font-serif text-xs italic text-muted-foreground">
                {step.caption}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function StepVisual({ type }: { type: string }) {
  switch (type) {
    case 'pile':
      return (
        <div className="absolute inset-2 flex items-center justify-center">
          <div className="relative w-full h-full">
            <div className="absolute top-1 left-1 w-8 h-6 bg-border -rotate-6" />
            <div className="absolute top-3 left-4 w-8 h-6 bg-muted-foreground/20 rotate-3" />
            <div className="absolute top-2 left-2 w-8 h-6 bg-muted-foreground/30 -rotate-2" />
            <div className="absolute bottom-2 right-2 w-8 h-6 bg-muted-foreground/40 rotate-6" />
            <div className="absolute bottom-3 right-4 w-8 h-6 bg-border -rotate-3" />
          </div>
        </div>
      )
    case 'grid':
      return (
        <div className="absolute inset-3 grid grid-cols-3 gap-1">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`${[1, 4, 7].includes(i) ? 'bg-muted-foreground/40' : 'bg-border'
                }`}
            />
          ))}
        </div>
      )
    case 'spread':
      return (
        <div className="absolute inset-2 flex gap-1">
          <div className="flex-1 bg-surface border border-border flex items-center justify-center">
            <div className="w-8 h-6 bg-muted-foreground/30" />
          </div>
          <div className="flex-1 bg-surface border border-border flex items-center justify-center">
            <div className="w-8 h-6 bg-muted-foreground/30" />
          </div>
        </div>
      )
    case 'parcel':
      return (
        <div className="absolute inset-3 bg-[#c4a77d] flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-primary/80" />
        </div>
      )
    default:
      return null
  }
}
