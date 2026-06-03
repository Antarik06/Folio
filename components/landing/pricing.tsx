'use client'

import { useEffect, useRef, useState } from 'react'

const tiers = [
  {
    name: 'Studio',
    price: 'Free',
    description: 'Create unlimited digital albums. Share with anyone via link. Perfect for testing the waters.',
    primary: false,
  },
  {
    name: 'Press',
    price: '₹899',
    priceDetail: '/book',
    description: 'Softcover print. 24-80 pages. Premium matte paper. The perfect first physical album.',
    primary: true,
  },
  {
    name: 'Folio',
    price: '₹1,499',
    priceDetail: '/book',
    description: 'Hardcover lay-flat binding. 24-120 pages. Archival quality. Made to be an heirloom.',
    primary: false,
  },
]

export function Pricing() {
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
    <section ref={sectionRef} className="py-20 md:py-32 px-6 md:px-12 lg:px-20 max-w-4xl mx-auto">
      <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
        Honest numbers
      </h2>
      <p className="text-muted-foreground mb-16">
        No subscriptions. No hidden fees. Pay only when you print.
      </p>

      <div className="space-y-0">
        {tiers.map((tier, index) => (
          <div key={tier.name}>
            {/* Divider */}
            {index > 0 && <div className="h-px bg-border" />}
            
            <div 
              className={`py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Left: Tier name and description */}
              <div className="flex-1">
                <h3 className={`font-serif text-xl ${tier.primary ? 'italic' : ''} text-foreground`}>
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md">
                  {tier.description}
                </p>
              </div>
              
              {/* Right: Price and CTA */}
              <div className="flex items-center gap-8 md:gap-12">
                <div className="font-mono text-2xl text-foreground">
                  {tier.price}
                  {tier.priceDetail && (
                    <span className="text-sm text-muted-foreground">{tier.priceDetail}</span>
                  )}
                </div>
                
                <a 
                  href="#" 
                  className="text-primary hover:text-primary/80 transition-colors text-sm underline underline-offset-4 decoration-primary/50 hover:decoration-primary whitespace-nowrap"
                >
                  {tier.price === 'Free' ? 'Start free' : 'Order now'}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
