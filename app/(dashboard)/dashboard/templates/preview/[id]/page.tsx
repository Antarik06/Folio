import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export default async function TemplatePreviewPage({ params }: Props) {
  const { id } = await params
  const template = ALL_MAGAZINE_TEMPLATES.find(t => t.id === id)
  
  if (!template) {
    notFound()
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Editorial Header */}
      <div className="border-b border-border bg-card/30 backdrop-blur-md sticky top-[64px] z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link 
              href="/dashboard/templates"
              className="text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Templates
            </Link>
            <div className="h-4 w-px bg-border" />
            <div>
              <h1 className="font-serif text-2xl text-foreground">{template.name}</h1>
              <p className="text-[10px] uppercase tracking-widest text-primary font-bold">
                {template.category} Category
              </p>
            </div>
          </div>
          
          <Link
            href={`/dashboard/templates/use/${template.id}`}
            className="bg-primary text-primary-foreground px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Create with this Layout
          </Link>
        </div>
      </div>

      {/* Preview Content */}
      <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col gap-32">
        {template.spreads.map((spread, index) => (
          <section key={spread.id} className="relative">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                 <h2 className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-bold">
                    Spread {index + 1} — {spread.isCover ? 'Cover Design' : 'Internal Layout'}
                 </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted p-12 lg:p-24 shadow-inner">
                {/* Simplified visual representation of the spread */}
                <div 
                  className="aspect-[3/4] bg-white shadow-2xl relative overflow-hidden"
                  style={{ background: spread.front?.background || spread.background }}
                >
                  {spread.front?.elements.map(el => (
                    el.type === 'image' ? (
                      <div 
                        key={el.id}
                        className="absolute bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold text-center"
                        style={{
                          left: `${(el.x / 700) * 100}%`,
                          top: `${(el.y / 1000) * 100}%`,
                          width: `${(el.width / 700) * 100}%`,
                          height: `${(el.height / 1000) * 100}%`,
                          zIndex: el.zIndex
                        }}
                      >
                        {el.src ? (
                          <img src={el.src} alt="" className="w-full h-full object-cover" />
                        ) : 'Image Placeholder'}
                      </div>
                    ) : el.type === 'text' ? (
                      <div 
                        key={el.id}
                        className="absolute flex items-center"
                        style={{
                          left: `${(el.x / 700) * 100}%`,
                          top: `${(el.y / 1000) * 100}%`,
                          width: `${(el.width / 700) * 100}%`,
                          height: `${(el.height / 1000) * 100}%`,
                          zIndex: el.zIndex,
                          fontSize: `${(el.fontSize / 700) * 100}cqw`,
                          fontFamily: el.fontFamily === 'serif' ? 'var(--font-serif)' : 'inherit',
                          color: el.fill,
                          textAlign: el.textAlign as any || 'left'
                        }}
                      >
                        {el.text}
                      </div>
                    ) : null
                  ))}
                </div>

                <div 
                  className="aspect-[3/4] bg-white shadow-2xl relative overflow-hidden hidden md:block"
                  style={{ background: spread.back?.background || spread.background }}
                >
                   {spread.back ? (
                      spread.back.elements.map(el => (
                        el.type === 'image' ? (
                          <div 
                            key={el.id}
                            className="absolute bg-muted flex items-center justify-center text-[10px] text-muted-foreground uppercase font-bold text-center"
                            style={{
                              left: `${(el.x / 700) * 100}%`,
                              top: `${(el.y / 1000) * 100}%`,
                              width: `${(el.width / 700) * 100}%`,
                              height: `${(el.height / 1000) * 100}%`,
                              zIndex: el.zIndex
                            }}
                          >
                            <img src={el.src} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : el.type === 'text' ? (
                          <div 
                            key={el.id}
                            className="absolute flex items-center"
                            style={{
                              left: `${(el.x / 700) * 100}%`,
                              top: `${(el.y / 1000) * 100}%`,
                              width: `${(el.width / 700) * 100}%`,
                              height: `${(el.height / 1000) * 100}%`,
                              zIndex: el.zIndex,
                              fontSize: `${(el.fontSize / 700) * 100}cqw`,
                              fontFamily: el.fontFamily === 'serif' ? 'var(--font-serif)' : 'inherit',
                              color: el.fill,
                              textAlign: el.textAlign as any || 'left'
                            }}
                          >
                            {el.text}
                          </div>
                        ) : null
                      ))
                   ) : (
                      <div className="w-full h-full flex items-center justify-center border-l border-border bg-muted/20">
                         <p className="text-[10px] uppercase tracking-widest text-muted-foreground">End of Volume</p>
                      </div>
                   )}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
      
      {/* Bottom CTA */}
      <div className="bg-card border-t border-border py-24 text-center">
         <h3 className="font-serif text-5xl text-foreground mb-4">Tell your story in style.</h3>
         <p className="text-muted-foreground mb-12 max-w-xl mx-auto">
            This magazine format is optimized for professional printing and high-res digital sharing.
         </p>
         <Link
            href={`/dashboard/templates/use/${template.id}`}
            className="bg-primary text-primary-foreground px-12 py-5 text-sm font-bold uppercase tracking-[0.3em] hover:bg-primary/90 transition-all"
         >
            Create My Magazine
         </Link>
      </div>
    </div>
  )
}
