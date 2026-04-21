'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlbumSpread } from '@/components/album-editor/types'
import { ChevronLeft, ChevronRight, Edit3, Settings2, Check, ArrowRight, MousePointer2 } from 'lucide-react'

interface Props {
  album: any
  initialSpreads: AlbumSpread[]
  photos: string[]
}

export function QuickBuilder({ album, initialSpreads, photos }: Props) {
  const router = useRouter()
  const [spreads, setSpreads] = useState<AlbumSpread[]>(initialSpreads)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('albums')
      .update({
        layout_data: {
          ...album.layout_data,
          spreads: spreads
        }
      })
      .eq('id', album.id)

    if (!error) {
       router.push(`/dashboard/templates/checkout/${album.id}`)
    }
    setSaving(false)
  }

  const handlePhotoSwap = (spreadId: string, pageType: 'front' | 'back', elementId: string) => {
    // Simple cycling for now, or could open a picker
    const nextSpreads = [...spreads]
    const spread = nextSpreads.find(s => s.id === spreadId)
    if (!spread) return

    const page = pageType === 'front' ? spread.front : spread.back
    if (!page) return

    const element = page.elements.find(el => el.id === elementId)
    if (element && element.type === 'image') {
       // Find current photo index and go to next
       const currentIdx = photos.indexOf(element.src || '')
       const nextIdx = (currentIdx + 1) % photos.length
       element.src = photos[nextIdx]
       setSpreads(nextSpreads)
    }
  }

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Top Bar */}
      <header className="h-20 bg-white border-b border-border flex items-center justify-between px-8 shrink-0 z-50">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">
             <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="font-serif text-xl">{album.title || 'Magazine Draft'}</h1>
            <p className="text-[10px] uppercase tracking-widest text-primary font-bold">Quick Build Mode</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push(`/editor/${album.id}`)}
            className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-foreground px-4 py-2 border border-border"
          >
            <Settings2 className="w-3.5 h-3.5" />
            Switch to Advanced Editor
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-ink text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-ink/90 transition-all flex items-center gap-2"
          >
            {saving ? 'Finalizing...' : 'Preview & Order'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Preview Area */}
      <main className="flex-1 overflow-y-auto bg-[#F5F5F3] p-12 lg:p-20 flex flex-col items-center gap-32">
        <div className="max-w-6xl w-full">
           <div className="mb-20 text-center">
              <span className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground font-bold mb-4 block">Click any image to swap it</span>
              <div className="h-px w-20 bg-primary/20 mx-auto" />
           </div>

           {spreads.map((spread, sIdx) => (
             <div key={spread.id} className="mb-40 group">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary italic">
                    Spread {sIdx + 1} {spread.isCover ? '— The Cover' : ''}
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/40 p-12 lg:p-16 shadow-2xl backdrop-blur-sm border border-white/60">
                   {/* FRONT PAGE */}
                   <div 
                      className="aspect-[3/4] bg-white shadow-xl relative overflow-hidden group/page border border-border/50"
                      style={{ background: spread.front?.background || spread.background }}
                    >
                      {spread.front?.elements.map(el => (
                        el.type === 'image' ? (
                          <button 
                            key={el.id}
                            onClick={() => handlePhotoSwap(spread.id!, 'front', el.id!)}
                            className="absolute bg-muted flex items-center justify-center overflow-hidden transition-all hover:ring-4 hover:ring-primary/30 group/img shadow-sm"
                            style={{
                              left: `${(el.x / 700) * 100}%`,
                              top: `${(el.y / 1000) * 100}%`,
                              width: `${(el.width / 700) * 100}%`,
                              height: `${(el.height / 1000) * 100}%`,
                              zIndex: el.zIndex
                            }}
                          >
                            <img src={el.src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                               <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100 transition-all shadow-xl">
                                  <Edit3 className="w-5 h-5 text-ink" />
                               </div>
                            </div>
                          </button>
                        ) : (
                          <div 
                            key={el.id}
                            className="absolute p-2 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left flex items-center"
                            style={{
                              left: `${(el.x / 700) * 100}%`,
                              top: `${(el.y / 1000) * 100}%`,
                              width: `${(el.width / 700) * 100}%`,
                              height: `${(el.height / 1000) * 100}%`,
                              zIndex: el.zIndex,
                              fontSize: `${(el.fontSize / 700) * 100}cqw`,
                              fontFamily: el.fontFamily === 'serif' ? 'var(--font-serif)' : 'inherit',
                              color: el.fill,
                              fontWeight: el.fontWeight,
                              textAlign: el.textAlign as any || 'left'
                            }}
                          >
                            {el.text}
                          </div>
                        )
                      ))}
                    </div>

                    {/* BACK PAGE */}
                    <div 
                      className="aspect-[3/4] bg-white shadow-xl relative overflow-hidden group/page border border-border/50 hidden md:block"
                      style={{ background: spread.back ? (spread.back.background || spread.background) : '#F9F9F9' }}
                    >
                      {spread.back ? (
                        spread.back.elements.map(el => (
                          el.type === 'image' ? (
                            <button 
                              key={el.id}
                              onClick={() => handlePhotoSwap(spread.id!, 'back', el.id!)}
                              className="absolute bg-muted flex items-center justify-center overflow-hidden transition-all hover:ring-4 hover:ring-primary/30 group/img shadow-sm"
                              style={{
                                left: `${(el.x / 700) * 100}%`,
                                top: `${(el.y / 1000) * 100}%`,
                                width: `${(el.width / 700) * 100}%`,
                                height: `${(el.height / 1000) * 100}%`,
                                zIndex: el.zIndex
                              }}
                            >
                              <img src={el.src} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-all flex items-center justify-center">
                                 <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100 transition-all shadow-xl">
                                    <Edit3 className="w-5 h-5 text-ink" />
                                 </div>
                              </div>
                            </button>
                          ) : (
                            <div 
                              key={el.id}
                              className="absolute p-2 border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left flex items-center"
                              style={{
                                left: `${(el.x / 700) * 100}%`,
                                top: `${(el.y / 1000) * 100}%`,
                                width: `${(el.width / 700) * 100}%`,
                                height: `${(el.height / 1000) * 100}%`,
                                zIndex: el.zIndex,
                                fontSize: `${(el.fontSize / 700) * 100}cqw`,
                                fontFamily: el.fontFamily === 'serif' ? 'var(--font-serif)' : 'inherit',
                                color: el.fill,
                                fontWeight: el.fontWeight,
                                textAlign: el.textAlign as any || 'left'
                              }}
                            >
                              {el.text}
                            </div>
                          )
                        ))
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#F9F9F9]">
                           <span className="text-[10px] uppercase tracking-widest text-muted-foreground/30">Inside Cover</span>
                        </div>
                      )}
                    </div>
                </div>
             </div>
           ))}
        </div>
      </main>

      {/* Quick Actions Footer */}
      <div className="h-24 bg-ink text-white border-t border-ink shrink-0 flex items-center justify-center gap-12 px-8 z-50">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold">1</div>
             <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Auto-Layout</p>
             <Check className="w-4 h-4 text-green-400" />
          </div>
          <div className="h-px w-12 bg-white/10" />
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center text-[10px] font-bold text-white">2</div>
             <p className="text-[10px] uppercase tracking-widest font-bold">Refine Spreads</p>
          </div>
          <div className="h-px w-12 bg-white/10" />
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-bold text-white/50 text-white/50">3</div>
             <p className="text-[10px] uppercase tracking-widest font-bold text-white/50">Preview & Ship</p>
          </div>
      </div>
    </div>
  )
}
