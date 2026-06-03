'use client'

import { useEffect, useRef, useState } from 'react'

const templates = [
  { name: 'Classic', color: 'bg-surface', accent: 'border-border' },
  { name: 'Minimal', color: 'bg-paper', accent: 'border-linen' },
  { name: 'Journal', color: 'bg-[#e8e0d5]', accent: 'border-pencil/30' },
  { name: 'Bold', color: 'bg-darkroom', accent: 'border-pencil' },
  { name: 'Rose', color: 'bg-[#e8dcd5]', accent: 'border-primary/30' },
  { name: 'Sage', color: 'bg-[#dce5e0]', accent: 'border-secondary/30' },
]

export function TemplatePreview() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    <section ref={sectionRef} className="py-20 md:py-32 bg-paper overflow-hidden">
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Showing: All occasions
            </p>
            <h2 className="font-serif text-3xl md:text-4xl text-foreground">
              The specimen book
            </h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Start from a template. Make it yours. Or let AI surprise you.
          </p>
        </div>

        {/* Template spines - horizontal scroll */}
        <div 
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto pb-4 scrollbar-hide transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {templates.map((template, index) => (
            <button
              key={template.name}
              onClick={() => setSelectedTemplate(index)}
              className={`shrink-0 w-20 h-48 relative transition-all duration-300 ${template.color} border ${template.accent} ${
                selectedTemplate === index ? 'border-t-2 border-t-primary' : ''
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Spine text */}
              <span 
                className={`absolute top-4 left-1/2 -translate-x-1/2 font-serif text-xs writing-vertical ${
                  template.name === 'Bold' ? 'text-paper' : 'text-foreground'
                }`}
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                {template.name}
              </span>
              
              {/* Texture line */}
              <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-px h-12 ${
                template.name === 'Bold' ? 'bg-pencil' : 'bg-border'
              }`} />
            </button>
          ))}
        </div>

        {/* Preview spread */}
        <div 
          className={`mt-8 transition-all duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className={`aspect-[2/1] max-w-4xl mx-auto ${templates[selectedTemplate].color} border ${templates[selectedTemplate].accent} p-6 md:p-10`}>
            <div className="h-full flex gap-4 md:gap-8">
              {/* Left page */}
              <div className="flex-1 flex flex-col justify-center">
                <div className={`aspect-[4/3] ${
                  templates[selectedTemplate].name === 'Bold' ? 'bg-pencil/30' : 'bg-muted-foreground/10'
                } mb-4`} />
                <div className={`h-1 w-2/3 ${
                  templates[selectedTemplate].name === 'Bold' ? 'bg-paper/20' : 'bg-border'
                }`} />
              </div>
              
              {/* Center gutter */}
              <div className={`w-px ${
                templates[selectedTemplate].name === 'Bold' ? 'bg-pencil' : 'bg-border'
              }`} />
              
              {/* Right page */}
              <div className="flex-1 flex flex-col justify-center">
                <div className={`h-1 w-1/2 mb-4 ${
                  templates[selectedTemplate].name === 'Bold' ? 'bg-paper/20' : 'bg-border'
                }`} />
                <div className={`h-1 w-3/4 mb-4 ${
                  templates[selectedTemplate].name === 'Bold' ? 'bg-paper/10' : 'bg-border/60'
                }`} />
                <div className={`aspect-[4/3] ${
                  templates[selectedTemplate].name === 'Bold' ? 'bg-pencil/30' : 'bg-muted-foreground/10'
                }`} />
              </div>
            </div>
          </div>
          
          {/* Template info */}
          <div className="mt-6 text-center">
            <h3 className="font-serif text-xl text-foreground">
              {templates[selectedTemplate].name}
            </h3>
            <p className="font-mono text-xs text-muted-foreground mt-1">
              24 pages · Lay-flat binding
            </p>
            <button className="mt-4 text-primary hover:text-primary/80 transition-colors text-sm">
              Use this layout
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
