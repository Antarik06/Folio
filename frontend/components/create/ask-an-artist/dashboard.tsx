'use client'

import React, { useState } from 'react'
import {
  LabelledBlock,
  MonoLabel,
  PageMasthead,
  SpecPill,
  StampButton,
} from '@/components/folio/primitives'
import { ArtistIntake } from './intake'
import { ArtistWorkspace } from './workspace'
import { ArtistLead, HOUSE_LEAD } from './artist-lead'

/**
 * Screen 06 — Ask an Artist.
 *
 * One name for one thing. This was "Premium", "Concierge" and "Premium
 * Concierge" across three screens; it is now a branch of Create, reached from
 * the style gallery's "Ways in".
 *
 * A commission, not a ticket: the artist leads, and the status of a live
 * commission is a lab ticket stamp rather than a coloured status chip.
 */

const STATUS_LABELS: Record<string, string> = {
  'briefing-received': 'Briefing received',
  'editor-assigned': 'Artist assigned',
  'first-draft': 'First draft ready',
  revisions: 'Revisions round',
  'final-approval': 'Final approval',
  printing: 'Sent to print',
  delivered: 'Delivered',
}

/** Only a finished commission reads as settled; everything else is in hand. */
function toneFor(status: string): 'primary' | 'secondary' | 'muted' {
  if (status === 'delivered') return 'muted'
  if (status === 'printing' || status === 'final-approval') return 'secondary'
  return 'primary'
}

interface ArtistCommissionsProps {
  initialProjects: any[]
  packages: any[]
  /** Rendered inside the Artist Studio rather than as its own screen. */
  embedded?: boolean
}

export function ArtistCommissions({
  initialProjects,
  packages,
  embedded = false,
}: ArtistCommissionsProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [activeProject, setActiveProject] = useState<any | null>(null)
  const [view, setView] = useState<'list' | 'intake' | 'workspace'>(
    initialProjects.length > 0 ? 'list' : 'intake'
  )

  const shell = embedded
    ? 'mx-auto max-w-[1200px]'
    : 'mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-12'

  function backToList() {
    setActiveProject(null)
    setView(projects.length > 0 ? 'list' : 'intake')
  }

  if (view === 'intake') {
    return (
      <div className={shell}>
        {projects.length > 0 ? (
          <StampButton tone="ghost" size="sm" onClick={backToList} className="mb-6">
            ← Commissions
          </StampButton>
        ) : null}

        <PageMasthead
          eyebrow="Create — Ask an Artist"
          title="Hand it to someone"
          meta="Brief · photos · deposit"
        />

        <div className="mt-8 rounded-[4px] border border-border bg-card p-4 sm:p-8">
          <ArtistLead artist={HOUSE_LEAD} />

          <div className="mt-7 border-l-2 border-primary pl-5">
            <p className="font-serif text-lg italic leading-relaxed text-ink-soft sm:text-xl">
              Tell them about the day — what mattered, who to look for, what to
              leave out.
            </p>
          </div>

          <div className="mt-6">
            <ArtistIntake
              packages={packages}
              onComplete={(project: any) => {
                setProjects([project, ...projects])
                setActiveProject(project)
                setView('workspace')
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (view === 'workspace' && activeProject) {
    return (
      <div className={shell}>
        <StampButton tone="ghost" size="sm" onClick={backToList} className="mb-6">
          ← Commissions
        </StampButton>
        <ArtistWorkspace projectId={activeProject.id} />
      </div>
    )
  }

  return (
    <div className={shell}>
      <PageMasthead
        eyebrow="Create — Ask an Artist"
        title="Commissions"
        meta={`${projects.length} project${projects.length === 1 ? '' : 's'} · est. 12–15 days each`}
        actions={
          <StampButton tone="primary" size="sm" onClick={() => setView('intake')}>
            New commission
          </StampButton>
        }
      />

      <LabelledBlock label="In hand" className="mt-8">
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project: any) => {
            const status = project.status || 'briefing-received'
            const started = new Date(project.created_at).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })

            return (
              <article
                key={project.id}
                className="flex flex-col justify-between rounded-[4px] border border-border bg-card p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <SpecPill tone={toneFor(status)}>
                      {STATUS_LABELS[status] || status}
                    </SpecPill>
                    <MonoLabel size="xs" className="shrink-0">
                      {project.id.substring(0, 8)}
                    </MonoLabel>
                  </div>

                  <h3 className="mt-4 font-serif text-xl text-foreground">
                    {project.package_name || 'Commission'}
                  </h3>
                  <MonoLabel size="xs" className="mt-1">
                    Opened {started.toUpperCase()}
                  </MonoLabel>

                  <dl className="mt-4 grid grid-cols-2 gap-4 border-y border-border py-4">
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
                        Photos
                      </dt>
                      <dd className="mt-1 font-mono text-sm text-foreground">
                        {project.photo_uploads?.length || 0}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-soft">
                        Messages
                      </dt>
                      <dd className="mt-1 font-mono text-sm text-foreground">
                        {project.messages?.length || 0}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5">
                  <StampButton
                    tone="ink"
                    size="sm"
                    onClick={() => {
                      setActiveProject(project)
                      setView('workspace')
                    }}
                  >
                    Open workspace →
                  </StampButton>
                </div>
              </article>
            )
          })}
        </div>
      </LabelledBlock>
    </div>
  )
}
