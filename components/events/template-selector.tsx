'use client'

import React from 'react'
import { ALL_MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { inferTemplateProductType, productTypeLabel } from '@/lib/product-type'
import { useRouter } from 'next/navigation'

interface TemplateSelectorProps {
  eventId: string
}

export function TemplateSelector({ eventId }: TemplateSelectorProps) {
  const router = useRouter()
  const [isPending, setIsPending] = React.useState<string | null>(null)

  const handleUseTemplate = async (templateId: string) => {
    setIsPending(templateId)
    // We'll use a direct fetch to a new action or just use the page we created
    // But since we are already in an event, we should probably just create it directly
    // Let's call a client-side wrapper of the create action
    router.push(`/dashboard/templates/use/${templateId}?eventId=${eventId}`)
    // Wait, I can just create a client-side action that calls the server action
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {ALL_MAGAZINE_TEMPLATES.map((template) => (
        <div key={template.id} className="group relative bg-card border border-border overflow-hidden flex flex-col">
          <div className="aspect-[4/5] relative overflow-hidden bg-muted">
            <img 
              src={template.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
              <h4 className="text-white font-serif text-lg mb-2">{template.name}</h4>
              <p className="text-white/70 text-xs mb-6 line-clamp-2">{template.description}</p>
              
              <button
                onClick={() => handleUseTemplate(template.id)}
                disabled={!!isPending}
                className="bg-white text-black px-6 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-colors"
              >
                {isPending === template.id ? 'Creating...' : 'Select'}
              </button>
            </div>
            <div className="absolute top-3 left-3">
              <span className="bg-background/90 text-foreground border border-border px-2 py-1 text-[10px] uppercase tracking-widest font-semibold">
                {productTypeLabel(inferTemplateProductType(template))}
              </span>
            </div>
          </div>
          <div className="p-4 border-t border-border bg-background">
            <h3 className="font-medium text-sm text-foreground">{template.name}</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">{template.category}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
