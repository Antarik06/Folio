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

  // Fetch user's events to show in the "Use Template" modal (simplified for now)
  const { data: events } = await supabase
    .from('events')
    .select('id, title')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="font-serif text-4xl text-foreground mb-4">Magazine Templates</h1>
        <p className="text-muted-foreground text-lg max-w-2xl">
          Start with a professionally designed travel magazine layout. 
          Just add your photos and customize the text to tell your unique story.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MAGAZINE_TEMPLATES.map((template) => (
          <div key={template.id} className="group bg-card border border-border overflow-hidden flex flex-col">
            <div className="aspect-[3/4] relative overflow-hidden bg-muted">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-6 text-center">
                 <p className="text-white text-sm font-medium">{template.description}</p>
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-background/90 backdrop-blur-md text-foreground px-3 py-1 text-[10px] uppercase tracking-widest font-semibold border border-border">
                  {template.category}
                </span>
              </div>
            </div>
            <div className="p-6 border-t border-border flex-1 flex flex-col">
              <h3 className="font-serif text-2xl text-foreground mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">
                {template.spreads.length} spreads · Fully customizable
              </p>
              
              <div className="flex items-center gap-3">
                 <Link 
                    href={`/dashboard/templates/preview/${template.id}`}
                    className="flex-1 text-center py-3 border border-border text-sm hover:bg-secondary/5 transition-colors"
                 >
                    Preview
                 </Link>
                 <Link
                    href={`/dashboard/templates/use/${template.id}`}
                    className="flex-1 text-center py-3 bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
                 >
                    Use Template
                 </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State if no templates (shouldn't happen with our mock data) */}
      {MAGAZINE_TEMPLATES.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-border rounded-lg">
          <p className="text-muted-foreground">No templates available yet.</p>
        </div>
      )}
    </div>
  )
}
