'use client'

import React from 'react'
import { atom, useAtom } from 'jotai'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Home, CreditCard } from 'lucide-react'

export const magazinePageAtom = atom(0)

interface MagazinePreviewUIProps {
  album: any
}

export function MagazinePreviewUI({ album }: MagazinePreviewUIProps) {
  const [page, setPage] = useAtom(magazinePageAtom)
  const spreads    = album.layout_data?.spreads || []
  const totalPages = spreads.length + 1

  return (
    <>
      <nav className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-8">
        {/* Top */}
        <div className="flex items-center justify-between pointer-events-auto">
          <Link
            href="/dashboard/templates"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide uppercase">Templates</span>
          </Link>

          <div className="text-right">
            <h2 className="font-serif text-2xl text-white tracking-wide">{album.title}</h2>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Magazine Preview</p>
          </div>
        </div>

        {/* Page navigation */}
        <div className="flex items-center justify-center gap-4 pointer-events-auto overflow-x-auto scrollbar-hide py-4 max-w-full">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === page ? 'bg-primary scale-125' : 'bg-white/20'
                }`}
                title={i === 0 ? 'Cover' : `Spread ${i}`}
              />
            ))}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all border border-white/5"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 pointer-events-auto">
          <p className="text-white/30 text-xs uppercase tracking-widest font-mono">
            Drag to rotate · Click arrows to flip pages
          </p>
          <button className="flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-primary/90 transition-all transform hover:scale-105 shadow-2xl shadow-primary/20">
            <CreditCard className="w-5 h-5" />
            Proceed to Payment
          </button>
        </div>
      </nav>

      <style jsx global>{`
        .outline-text {
          -webkit-text-stroke: 2px rgba(255,255,255,0.5);
        }
        @keyframes horizontal-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .animate-horizontal-scroll {
          animation: horizontal-scroll 60s linear infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  )
}
