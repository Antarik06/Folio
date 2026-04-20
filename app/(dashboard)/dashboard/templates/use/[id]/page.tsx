import { createClient } from '@/lib/supabase/server'
import { MAGAZINE_TEMPLATES } from '@/lib/magazine-templates'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ eventId?: string }>
}

export default async function UseTemplatePage({ params, searchParams }: Props) {
  const { id } = await params
  const { eventId } = await searchParams
  const template = MAGAZINE_TEMPLATES.find(t => t.id === id)
  if (!template) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // If eventId is provided, attempt to auto-create and redirect
  if (eventId) {
    const { data: event } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single()

    if (event) {
       const { data: album } = await supabase
          .from('albums')
          .insert({
            event_id: event.id,
            owner_id: user.id,
            title: `${template.name} - ${event.title}`,
            layout_data: { spreads: template.spreads }
          })
          .select()
          .single()

       if (album) {
          redirect(`/editor/${album.id}`)
       }
    }
  }

  // Fetch user's events where they are host or manager
  const { data: hostedEvents } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-3xl text-foreground mb-4">Start with {template.name}</h1>
        <p className="text-muted-foreground">Select an event to create this magazine for.</p>
      </div>

      <div className="space-y-4">
        {hostedEvents && hostedEvents.length > 0 ? (
          hostedEvents.map((event) => (
            <form 
              key={event.id}
              action={async () => {
                'use server'
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: album, error } = await supabase
                  .from('albums')
                  .insert({
                    event_id: event.id,
                    owner_id: user.id,
                    title: `${template.name} - ${event.title}`,
                    layout_data: { spreads: template.spreads }
                  })
                  .select()
                  .single()

                if (error) {
                    console.error('Error creating album from template:', error)
                    return
                }

                if (album) {
                  redirect(`/editor/${album.id}`)
                }
              }}
            >
              <button 
                type="submit"
                className="w-full text-left p-6 bg-card border border-border hover:border-primary/50 transition-colors group flex items-center justify-between"
              >
                <div>
                  <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'No date set'}
                  </p>
                </div>
                <div className="bg-primary/10 text-primary px-4 py-2 text-xs font-bold uppercase tracking-wider group-hover:bg-primary group-hover:text-white transition-colors">
                  Select Event
                </div>
              </button>
            </form>
          ))
        ) : (
          <div className="p-12 border-2 border-dashed border-border text-center">
            <p className="text-muted-foreground mb-6">You need to create an event first to start an album.</p>
            <Link 
              href="/dashboard/events/new"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider"
            >
              Create New Event
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-border flex justify-center">
        <Link 
          href="/dashboard/templates"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Choose a different template
        </Link>
      </div>
    </div>
  )
}
