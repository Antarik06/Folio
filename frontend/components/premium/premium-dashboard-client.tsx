'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, MessageSquare, CheckSquare, RefreshCw, FileText, ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PremiumIntake } from './premium-intake'
import { PremiumWorkspace } from './premium-workspace'

interface PremiumDashboardClientProps {
  initialProjects: any[]
  packages: any[]
  embedded?: boolean
}

export function PremiumDashboardClient({ initialProjects, packages, embedded = false }: PremiumDashboardClientProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [activeProject, setActiveProject] = useState<any | null>(null)
  const [view, setView] = useState<'list' | 'intake' | 'workspace'>(
    initialProjects.length > 0 ? 'list' : 'intake'
  )

  const handleProjectCreated = (newProject: any) => {
    setProjects([newProject, ...projects])
    setActiveProject(newProject)
    setView('workspace')
  }

  const handleBackToList = () => {
    setActiveProject(null)
    setView(projects.length > 0 ? 'list' : 'intake')
  }

  if (view === 'intake') {
    return (
      <div className={`${embedded ? 'max-w-4xl px-0 py-6 mt-0' : 'max-w-4xl px-4 py-16 mt-12'} mx-auto`}>
        {projects.length > 0 && (
          <Button variant="ghost" onClick={handleBackToList} className="gap-2 text-sm mb-8 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        )}
        <PremiumIntake packages={packages} onComplete={handleProjectCreated} />
      </div>
    )
  }

  if (view === 'workspace' && activeProject) {
    return (
      <div className={`${embedded ? 'max-w-7xl px-0 py-4 mt-0' : 'max-w-7xl px-4 py-8 mt-12'} mx-auto`}>
        <Button variant="ghost" onClick={handleBackToList} className="gap-2 text-sm mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Exit Workspace
        </Button>
        <PremiumWorkspace projectId={activeProject.id} />
      </div>
    )
  }

  return (
    <div className={`${embedded ? 'max-w-6xl px-0 py-2 pb-8 mt-0' : 'max-w-6xl px-6 py-16 pb-32 mt-16'} mx-auto`}>
      <div className={`flex justify-between items-center border-b border-border ${embedded ? 'mb-8 pb-6' : 'mb-12 pb-8'}`}>
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 block">
            Premium Concierge
          </span>
          <h1 className="font-serif text-5xl text-foreground mb-4">Concierge Workspace</h1>
          <p className="text-muted-foreground text-sm font-light max-w-xl leading-relaxed">
            Collaborate directly with design artists, review layout proofs, chat, and manage print finalizations.
          </p>
        </div>
        <Button onClick={() => setView('intake')} className="gap-2 bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-wider text-xs px-5 py-3 h-11">
          <Plus className="w-4 h-4" /> Start New Project
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {projects.map((project: any) => {
          const statusColors: any = {
            'briefing-received': 'bg-blue-950/30 text-blue-400 border-blue-900/50',
            'editor-assigned': 'bg-amber-950/30 text-amber-400 border-amber-900/50',
            'first-draft': 'bg-purple-950/30 text-purple-400 border-purple-900/50',
            'revisions': 'bg-pink-950/30 text-pink-400 border-pink-900/50',
            'final-approval': 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50',
            'printing': 'bg-cyan-950/30 text-cyan-400 border-cyan-900/50',
            'delivered': 'bg-zinc-800 text-zinc-400 border-zinc-700'
          }

          const statusLabels: any = {
            'briefing-received': 'Briefing Received',
            'editor-assigned': 'Artist Assigned',
            'first-draft': 'First Draft Ready',
            'revisions': 'Revisions Round',
            'final-approval': 'Final Approval',
            'printing': 'Sent to Print',
            'delivered': 'Delivered'
          }

          const dateString = new Date(project.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })

          return (
            <div 
              key={project.id} 
              className="border border-border bg-card hover:border-primary/40 transition-all p-8 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors -z-10" />
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded border ${statusColors[project.status] || statusColors['briefing-received']}`}>
                    {statusLabels[project.status] || project.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ID: {project.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif text-2xl text-foreground group-hover:text-primary transition-colors">
                    {project.package_name || 'Concierge Package'} Project
                  </h3>
                  <p className="text-xs text-muted-foreground font-light">Started on {dateString}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/40 text-xs font-light">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Uploaded Photos</span>
                    <strong className="text-foreground font-semibold">{project.photo_uploads?.length || 0} files</strong>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground block">Workspace Chats</span>
                    <strong className="text-foreground font-semibold">{project.messages?.length || 0} logs</strong>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="text-xs font-light">
                  <span className="text-muted-foreground">Deposit Paid: </span>
                  <strong className="text-foreground font-semibold">Yes</strong>
                </div>
                
                <Button 
                  onClick={() => {
                    setActiveProject(project)
                    setView('workspace')
                  }}
                  className="gap-2 bg-foreground text-background dark:bg-foreground dark:text-background hover:opacity-90 font-bold uppercase tracking-wider text-[10px] h-9 px-4 rounded-lg"
                >
                  Enter Workspace
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
