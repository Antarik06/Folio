'use client'

import { useEffect, useRef, useState } from 'react'

const products = [
  {
    name: 'Softcover',
    material: '220gsm matte art paper / Soft laminate cover',
    dimensions: '20 × 20 cm · 24-80 pages',
    price: 'from ₹899',
    imagePosition: 'left',
  },
  {
    name: 'Hardcover Lay-flat',
    material: '250gsm premium photo paper / PU leather cover',
    dimensions: '25 × 25 cm · 24-120 pages',
    price: 'from ₹1,499',
    imagePosition: 'right',
  },
  {
    name: 'Magazine',
    material: '170gsm silk coated / Saddle-stitched',
    dimensions: 'A4 size · 16-48 pages',
    price: 'from ₹499',
    imagePosition: 'left',
  },
]

export function ProductFormats() {
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
    <section ref={sectionRef} className="py-20 md:py-32 bg-surface">
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-16 md:mb-20">
          The object catalogue
        </h2>

        <div className="space-y-0">
          {products.map((product, index) => (
            <div key={product.name}>
              {/* Divider */}
              {index > 0 && <div className="h-px bg-border" />}
              
              {/* Desktop: Alternating layout */}
              <div 
                className={`hidden md:grid md:grid-cols-2 gap-12 lg:gap-20 py-16 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {product.imagePosition === 'left' ? (
                  <>
                    <ProductImage name={product.name} />
                    <ProductSpec {...product} />
                  </>
                ) : (
                  <>
                    <ProductSpec {...product} />
                    <ProductImage name={product.name} />
                  </>
                )}
              </div>

              {/* Mobile: Always image top, text below */}
              <div 
                className={`md:hidden py-10 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <ProductImage name={product.name} />
                <div className="mt-6">
                  <ProductSpec {...product} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function ProductImage({ name }: { name: string }) {
  return (
    <div className="aspect-[4/3] bg-paper border border-border relative overflow-hidden flex items-center justify-center">
      {/* Stylized product representation */}
      <div className="relative">
        {name === 'Softcover' && (
          <div className="w-32 h-40 bg-card border border-border transform rotate-3 relative">
            <div className="absolute inset-2 border border-border/50" />
            <div className="absolute bottom-4 left-3 right-3 h-1 bg-muted-foreground/20" />
            <div className="absolute bottom-6 left-3 right-6 h-1 bg-muted-foreground/20" />
          </div>
        )}
        {name === 'Hardcover Lay-flat' && (
          <div className="flex">
            <div className="w-28 h-36 bg-darkroom border-y border-l border-border" />
            <div className="w-28 h-36 bg-card border border-border -ml-1 flex items-center justify-center">
              <div className="w-16 h-12 bg-muted-foreground/20" />
            </div>
          </div>
        )}
        {name === 'Magazine' && (
          <div className="w-28 h-40 bg-card border border-border transform -rotate-2 relative">
            <div className="absolute top-3 left-3 right-3">
              <div className="h-8 bg-terracotta/20 mb-2" />
              <div className="h-1 bg-muted-foreground/20 mb-1" />
              <div className="h-1 bg-muted-foreground/20 w-3/4" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProductSpec({ name, material, dimensions, price }: {
  name: string
  material: string
  dimensions: string
  price: string
  imagePosition?: string
}) {
  return (
    <div className="flex flex-col justify-center">
      <h3 className="font-serif text-2xl md:text-3xl text-foreground">
        {name}
      </h3>
      
      <p className="mt-4 font-mono text-xs text-muted-foreground tracking-wide">
        {material}
      </p>
      
      <p className="mt-2 font-mono text-xs text-muted-foreground">
        {dimensions}
      </p>
      
      <p className="mt-6 font-sans text-base text-foreground">
        {price}
      </p>
      
      <div className="mt-6">
        <a 
          href="#" 
          className="text-primary hover:text-primary/80 transition-colors text-sm"
        >
          See options →
        </a>
      </div>
    </div>
  )
}
