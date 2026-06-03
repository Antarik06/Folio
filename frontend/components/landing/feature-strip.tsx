'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FolderOpen, Tag, LayoutTemplate, HelpCircle, Gift, Share2, Sparkles } from 'lucide-react'

const features = [
  {
    number: '01',
    icon: Users,
    headline: 'Collaborative Gather',
    subtitle: 'Consolidate every lens in one place.',
    description: 'Create an event and invite your circle to drop their photos. Hosts and approved collaborators upload freely, keeping memories compiled in a high-fidelity collective hub with no storage limits.',
    tag: 'Gather'
  },
  {
    number: '02',
    icon: FolderOpen,
    headline: 'Folder Organization',
    subtitle: 'PC-style explorer directories.',
    description: 'Keep your memories structured. Escape flat lists and scroll fatigue with nested directories. Group photos in custom folders directly inside the event space for easy retrieval.',
    tag: 'Structure'
  },
  {
    number: '03',
    icon: Tag,
    headline: 'People & Location Tagging',
    subtitle: 'Map out the who and the where.',
    description: 'Collaboratively tag friends and pin locations on individual shots. Instantly filter the collective event gallery by tagged people or places to retrieve specific snapshots in seconds.',
    tag: 'Map'
  },
  {
    number: '04',
    icon: LayoutTemplate,
    headline: 'Popular Album Layouts',
    subtitle: 'Design spreads with artist styles.',
    description: 'Start from scratch with a blank layout or select a Popular Album template (Signature Wedding, Voyage, Fashion Portfolio) to structure gorgeous editorial magazine spreads instantly.',
    tag: 'Design'
  },
  {
    number: '05',
    icon: Gift,
    headline: 'Preserve & Gift',
    subtitle: 'Digital editions and matte prints.',
    description: 'Attach gifting or delivery instructions to your album sharing link. Print physical heirlooms bound in linen or textured hardcover, printed on heavy museum-grade 250gsm paper.',
    tag: 'Preserve'
  },
]

export function FeatureStrip() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-24 md:py-36 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto border-t border-border/20">
      
      {/* Introduction */}
      <div className="max-w-3xl mb-20 space-y-6">
        <span className="font-mono text-xs uppercase tracking-[0.25em] text-primary">
          Designed for Shared Lives
        </span>
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] text-balance">
          A place where stories don&apos;t get lost in the feed.
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed text-balance">
          We believe some memories are too heavy to live in temporary links or phone screens. Folio bridges the gap between shared digital moments and beautiful physical heirlooms.
        </p>
      </div>

      {/* Grid display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.12 }}
              key={feature.number}
              className="group relative bg-card dark:bg-card/40 border border-border/40 p-8 flex flex-col justify-between hover:border-primary/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5"
            >
              <div>
                {/* Header card indicator */}
                <div className="flex items-center justify-between mb-8">
                  <div className="w-10 h-10 rounded-none bg-primary/10 text-primary flex items-center justify-center transition-transform duration-500 group-hover:scale-110">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-serif text-3xl text-border/60 dark:text-border/20 group-hover:text-primary/30 transition-colors">
                    {feature.number}
                  </span>
                </div>

                {/* Text specs */}
                <div className="space-y-3">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-primary/80 font-bold bg-primary/5 px-2 py-0.5">
                    {feature.tag}
                  </span>
                  
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors duration-300">
                    {feature.headline}
                  </h3>
                  
                  <p className="font-sans text-sm font-semibold text-foreground/80 leading-snug">
                    {feature.subtitle}
                  </p>
                  
                  <p className="text-xs leading-relaxed text-muted-foreground pt-2">
                    {feature.description}
                  </p>
                </div>
              </div>

              {/* Bottom decorative bar */}
              <div className="mt-8 pt-4 border-t border-border/30 flex items-center justify-between">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  Folio Core
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
              </div>
            </motion.div>
          )
        })}
      </div>

    </section>
  )
}
