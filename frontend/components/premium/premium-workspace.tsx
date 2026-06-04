'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { MessageSquare, Upload, CheckCircle2, DollarSign, Clock, ArrowRight, Loader2, Sparkles, Send, FileText, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api-client'
import { formatPrice } from '@/lib/pricing'
import { createClient } from '@/lib/supabase/client'

interface PremiumWorkspaceProps {
  projectId: string
}

export function PremiumWorkspace({ projectId }: PremiumWorkspaceProps) {
  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'user' | 'artist' | 'admin'>('user')
  const [userId, setUserId] = useState<string | null>(null)
  
  // Chat input
  const [messageInput, setMessageInput] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Proof upload form (Artist/Admin only)
  const [proofUrl, setProofUrl] = useState('')
  const [proofNotes, setProofNotes] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)

  const loadProject = useCallback(async () => {
    try {
      const data = await apiClient.get(`/api/premium/projects/${projectId}`)
      if (data) {
        setProject(data)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    // 1. Fetch user profile from backend (supports Supabase JWT and mock dev session cookies)
    apiClient.get('/api/profile')
      .then(profile => {
        if (profile) {
          setUserId(profile.id)
          if (profile.role) {
            setUserRole(profile.role)
          }
        }
      })
      .catch(err => {
        console.error('Failed to load user profile in workspace:', err)
      })

    void loadProject()
  }, [projectId, loadProject])

  // 2. Poll project status and messages every 5 seconds for real-time sync
  useEffect(() => {
    const interval = setInterval(() => {
      void loadProject()
    }, 5000)

    return () => clearInterval(interval)
  }, [loadProject])

  // Scroll chat logs to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [project?.messages])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || sendingMsg) return

    setSendingMsg(true)
    try {
      const updated = await apiClient.post(`/api/premium/projects/${projectId}/message`, {
        text: messageInput.trim()
      })
      setProject(updated)
      setMessageInput('')
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSendingMsg(false)
    }
  }

  // Upload Proof (Artist/Admin only)
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!proofUrl.trim() || uploadingProof) return

    setUploadingProof(true)
    try {
      const updated = await apiClient.post(`/api/premium/projects/${projectId}/proof`, {
        proofUrl: proofUrl.trim(),
        notes: proofNotes.trim()
      })
      setProject(updated)
      setProofUrl('')
      setProofNotes('')
    } catch (err) {
      console.error('Failed to upload proof:', err)
    } finally {
      setUploadingProof(false)
    }
  }

  // Approve Project layout
  const handleApproveProject = async () => {
    setLoading(true)
    try {
      const updated = await apiClient.post(`/api/premium/projects/${projectId}/approve`)
      setProject(updated)
    } catch (err) {
      console.error('Failed to approve project layout:', err)
    } finally {
      setLoading(false)
    }
  }

  // Pay Final Balance (Dummy)
  const handlePayBalance = async () => {
    setLoading(true)
    try {
      const updated = await apiClient.post(`/api/premium/projects/${projectId}/balance-pay`)
      setProject(updated)
    } catch (err) {
      console.error('Failed to pay final balance:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="font-serif italic text-sm text-muted-foreground">Opening project workspace...</p>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8 bg-destructive/5 text-destructive rounded-xl border border-destructive/20 text-center">
        <h3 className="font-serif text-2xl mb-2">Error Loading Workspace</h3>
        <p className="text-sm">{error || 'Project data is missing.'}</p>
      </div>
    )
  }

  // Progress mapping
  const timelineSteps = [
    { key: 'briefing-received', label: 'Briefing' },
    { key: 'editor-assigned', label: 'Artist Assigned' },
    { key: 'first-draft', label: 'Layout Proofing' },
    { key: 'final-approval', label: 'Approved' },
    { key: 'printing', label: 'Sent to Print' },
    { key: 'delivered', label: 'Delivered' }
  ]

  const currentStepIndex = timelineSteps.findIndex(s => s.key === project.status)

  const messages = Array.isArray(project.messages) ? project.messages : []
  const proofs = Array.isArray(project.proofs) ? project.proofs : []
  const latestProof = proofs[proofs.length - 1] || null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* ── Left Column: Live Chat & Discussion ──────────────────────────────── */}
      <div className="lg:col-span-7 flex flex-col border border-border bg-card rounded-xl h-[650px] shadow-sm relative">
        <div className="border-b border-border px-6 py-4 flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-serif text-lg text-foreground">Workspace Discussion</h3>
            <p className="text-[10px] text-muted-foreground font-light">Collaborate live with your design artist</p>
          </div>
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-2">
              <Sparkles className="w-8 h-8 text-primary/30" />
              <p className="text-sm text-muted-foreground font-light italic">No messages logged yet. Say hello to get started!</p>
            </div>
          ) : (
            messages.map((msg: any) => {
              const isMe = msg.senderId === userId
              const date = new Date(msg.sentAt).toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit'
              })

              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-muted-foreground font-mono mb-1">{msg.senderName} ({msg.senderRole})</span>
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm ${
                    isMe 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-muted text-foreground rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed font-light">{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono mt-1">{date}</span>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="border-t border-border p-4 flex gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-background border border-border px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary font-light"
            disabled={sendingMsg}
          />
          <Button 
            type="submit" 
            disabled={sendingMsg || !messageInput.trim()}
            className="bg-primary text-white hover:bg-primary/95 px-4 h-[44px]"
          >
            {sendingMsg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>

      {/* ── Right Column: Specs, Proofs & CTAs ─────────────────────────────── */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Visual Timeline Progress Tracker */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-4 shadow-sm">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-3">Project Status</h4>
          
          <div className="flex justify-between items-center gap-2">
            {timelineSteps.map((step, idx) => {
              const isCompleted = idx < currentStepIndex
              const isActive = idx === currentStepIndex
              
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center text-center relative">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono text-[9px] font-bold transition-all ${
                    isCompleted ? 'bg-secondary border-secondary text-secondary-foreground' :
                    isActive ? 'bg-primary border-primary text-white scale-110' :
                    'border-border text-muted-foreground'
                  }`}>
                    {isCompleted ? <Check className="w-3 h-3" /> : idx + 1}
                  </div>
                  <span className={`text-[8px] uppercase tracking-wider mt-1.5 hidden md:block font-bold ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Proofing Section */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-4 shadow-sm">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Design Proof Review</h4>

          {latestProof ? (
            <div className="space-y-4">
              <div className="bg-muted/40 border border-border p-4 rounded-lg flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Latest Proof Uploaded</span>
                  <a 
                    href={latestProof.proofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-serif text-sm font-semibold hover:underline block truncate text-foreground"
                  >
                    View Layout Draft (PDF)
                  </a>
                  {latestProof.notes && (
                    <p className="text-xs text-muted-foreground mt-1 font-light italic truncate">Notes: {latestProof.notes}</p>
                  )}
                </div>
              </div>

              {/* User Approval Controls */}
              {project.status === 'first-draft' && userRole === 'user' && (
                <div className="space-y-3">
                  <Button 
                    onClick={handleApproveProject}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-widest text-xs h-10 rounded-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Design Layout
                  </Button>
                  <p className="text-[9px] text-muted-foreground font-light text-center leading-normal">Approving sends this design draft to preflight checks and opens final balance payment.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center bg-muted/20 border border-dashed border-border/80 rounded-lg">
              <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground font-light italic">Designer is preparing first draft proof...</p>
            </div>
          )}
        </div>

        {/* Payments Status & CTAs */}
        <div className="border border-border bg-card p-6 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Payout & Billing</h4>

          <div className="space-y-2 text-xs font-light">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Advance Deposit:</span>
              <strong className="text-foreground font-semibold">Paid ({formatPrice(project.advance_payment_amount)})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Remaining Balance:</span>
              <strong className="text-foreground font-semibold">
                {project.balance_paid_at ? 'Paid' : formatPrice(project.balance_amount)}
              </strong>
            </div>
          </div>

          {/* Balance Payment CTA */}
          {project.status === 'final-approval' && !project.balance_paid_at && userRole === 'user' && (
            <div className="pt-2">
              <Button
                onClick={handlePayBalance}
                className="w-full py-5 bg-primary text-white hover:bg-primary/95 font-bold uppercase tracking-widest text-xs h-11 rounded-lg flex items-center justify-center gap-2"
              >
                <DollarSign className="w-4 h-4" />
                Pay Final Balance {formatPrice(project.balance_amount)}
              </Button>
            </div>
          )}
        </div>

        {/* Artist / Admin Proof Upload Panel */}
        {(userRole === 'artist' || userRole === 'admin') && (
          <div className="border border-border bg-card p-6 rounded-xl space-y-4 shadow-sm">
            <h4 className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Designer Utilities</h4>
            
            <form onSubmit={handleUploadProof} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-muted-foreground">Proof PDF URL</label>
                <input
                  type="text"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://supabase-bucket/proofs/..."
                  className="w-full bg-background border border-border px-3 py-2 rounded text-xs focus:outline-none focus:border-primary font-mono"
                  required
                  disabled={uploadingProof}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase font-mono text-muted-foreground">Designer Notes</label>
                <textarea
                  rows={2}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Describe your design updates or request user reviews..."
                  className="w-full bg-background border border-border px-3 py-2 rounded text-xs focus:outline-none focus:border-primary font-light"
                  disabled={uploadingProof}
                />
              </div>

              <Button
                type="submit"
                disabled={uploadingProof || !proofUrl.trim()}
                className="w-full bg-foreground text-background dark:bg-foreground dark:text-background hover:opacity-90 font-bold uppercase tracking-wider text-[10px] h-9"
              >
                {uploadingProof ? 'Uploading Proof...' : 'Publish Draft Proof'}
              </Button>
            </form>
          </div>
        )}

      </div>

    </div>
  )
}
