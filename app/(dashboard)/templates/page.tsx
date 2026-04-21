import { createClient } from '@/lib/supabase/server'
import { MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-20 text-center">
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-4 block">Collection</span>
        <h1 className="font-serif text-5xl md:text-6xl text-foreground mb-6">Magazine Templates</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-light leading-relaxed">
          Curated layouts designed to transform your memories into a high-end publication. 
          Professional typography, spacious grids, and timeless aesthetics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {MAGAZINE_TEMPLATES.map((template) => (
          <div key={template.id} className="group flex flex-col">
            <Link 
              href={`/dashboard/templates/use/${template.id}`}
              className="aspect-[3/4] relative overflow-hidden bg-muted mb-8 block"
            >
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 group-hover:brightness-90"
              />
              <div className="absolute inset-0 bg-ink/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-6 left-6">
                <span className="bg-white/90 backdrop-blur-md text-ink px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold border border-white/20">
                  {template.category}
                </span>
              </div>
            </Link>
            
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif text-3xl text-foreground group-hover:text-primary transition-colors duration-500">
                  {template.name}
                </h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 font-light line-clamp-2">
                {template.description}
              </p>
              
              <div className="flex items-center gap-6">
                 <Link
                    href={`/dashboard/templates/use/${template.id}`}
                    className="text-[11px] uppercase tracking-[0.2em] font-bold text-foreground border-b border-foreground/20 pb-1 hover:border-primary hover:text-primary transition-all"
                 >
                    Select Template
                 </Link>
                 <Link 
                    href={`/dashboard/templates/preview/${template.id}`}
                    className="text-[11px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:text-foreground transition-colors"
                 >
                    View Layout
                 </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
