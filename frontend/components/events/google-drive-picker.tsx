'use client'

import { useState, useEffect, useCallback } from 'react'
import { Folder, Image as ImageIcon, Search, ArrowLeft, X, Check, Cloud, Loader2, AlertCircle } from 'lucide-react'
import { GoogleDriveFile } from '@/lib/google-drive'

interface GoogleDrivePickerProps {
  isOpen: boolean
  accessToken: string | null
  googleApiKey: string
  onClose: () => void
  onSelect: (files: GoogleDriveFile[]) => void
}

interface DriveItem {
  id: string
  name: string
  mimeType: string
  thumbnailLink?: string
  iconLink?: string
  size?: string
}

interface BreadcrumbItem {
  id: string | null
  name: string
}

export function GoogleDrivePicker({
  isOpen,
  accessToken,
  googleApiKey,
  onClose,
  onSelect,
}: GoogleDrivePickerProps) {
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([{ id: null, name: 'My Drive' }])
  const [selectedFiles, setSelectedFiles] = useState<Map<string, DriveItem>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarTab, setSidebarTab] = useState<'my-drive' | 'shared' | 'starred'>('my-drive')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Fetch files and folders from Google Drive API
  const fetchDriveFiles = useCallback(async (folderId: string | null, searchVal = '', tab = 'my-drive') => {
    if (!accessToken) return
    setLoading(true)
    setErrorMsg(null)

    try {
      let q = "trashed = false and (mimeType = 'application/vnd.google-apps.folder' or mimeType contains 'image/')"

      if (searchVal.trim()) {
        q += ` and name contains '${searchVal.replace(/'/g, "\\'")}'`
      } else if (tab === 'starred') {
        q += ' and starred = true'
      } else if (tab === 'shared') {
        q += ' and sharedWithMe = true'
      } else {
        q += ` and '${folderId || 'root'}' in parents`
      }

      const fields = 'files(id,name,mimeType,thumbnailLink,iconLink,size)'
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${fields}&pageSize=100`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Google Drive API error:', response.status, errorText)
        throw new Error(`Google API returned status ${response.status}`)
      }

      const data = await response.json()
      setItems(data.files || [])
    } catch (err: any) {
      console.error('Failed to load Google Drive files:', err)
      setErrorMsg(err.message || 'Failed to fetch items from Google Drive. Please make sure Google Drive API is enabled in your Cloud Console.')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  // Reload files when folder or tab changes
  useEffect(() => {
    if (isOpen && accessToken) {
      fetchDriveFiles(currentFolderId, searchQuery, sidebarTab)
    }
  }, [isOpen, accessToken, currentFolderId, sidebarTab, fetchDriveFiles])

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen || !accessToken) return
    const timer = setTimeout(() => {
      fetchDriveFiles(currentFolderId, searchQuery, sidebarTab)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, accessToken, currentFolderId, sidebarTab, fetchDriveFiles])

  if (!isOpen) return null

  // Folder navigation helper
  const navigateToFolder = (folderId: string, folderName: string) => {
    setSearchQuery('')
    setCurrentFolderId(folderId)
    setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }])
  }

  // Breadcrumb navigation click handler
  const handleBreadcrumbClick = (idx: number, item: BreadcrumbItem) => {
    setSearchQuery('')
    setCurrentFolderId(item.id)
    setBreadcrumbs(prev => prev.slice(0, idx + 1))
  }

  // Toggle file selection
  const handleToggleSelect = (item: DriveItem) => {
    const next = new Map(selectedFiles)
    if (next.has(item.id)) {
      next.delete(item.id)
    } else {
      next.set(item.id, item)
    }
    setSelectedFiles(next)
  }

  // Double click file to select and import immediately
  const handleDoubleClickFile = (item: DriveItem) => {
    const selected: GoogleDriveFile[] = [{
      id: item.id,
      name: item.name,
      mimeType: item.mimeType,
      url: `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`,
      thumbnailUrl: item.thumbnailLink || item.iconLink || '',
      size: item.size ? parseInt(item.size, 10) : undefined
    }]
    onSelect(selected)
    handleClose()
  }

  // Import selection back to parent uploader
  const handleImport = () => {
    const selectedList: GoogleDriveFile[] = []
    selectedFiles.forEach(item => {
      selectedList.push({
        id: item.id,
        name: item.name,
        mimeType: item.mimeType,
        url: `https://www.googleapis.com/drive/v3/files/${item.id}?alt=media`,
        thumbnailUrl: item.thumbnailLink || item.iconLink || '',
        size: item.size ? parseInt(item.size, 10) : undefined
      })
    })
    if (selectedList.length > 0) {
      onSelect(selectedList)
    }
    handleClose()
  }

  const handleClose = () => {
    setSelectedFiles(new Map())
    setCurrentFolderId(null)
    setBreadcrumbs([{ id: null, name: 'My Drive' }])
    setSearchQuery('')
    setErrorMsg(null)
    onClose()
  }

  const folders = items.filter(i => i.mimeType === 'application/vnd.google-apps.folder')
  const files = items.filter(i => i.mimeType !== 'application/vnd.google-apps.folder')

  const formatBytes = (bytesStr?: string) => {
    if (!bytesStr) return ''
    const bytes = parseInt(bytesStr, 10)
    if (isNaN(bytes) || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
      <div className="bg-card text-foreground border border-border w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl rounded-sm overflow-hidden film-grain">
        
        {/* Modal Header (Themed with aged paper and terracotta accent) */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-sm bg-primary/10 text-primary">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg text-foreground font-semibold">
                Google Drive Importer
              </h3>
              <p className="text-xs text-muted-foreground font-light">Select photos to import into your Folio album</p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 text-muted-foreground hover:text-foreground rounded-sm transition-colors hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-border/80 flex flex-wrap items-center justify-between gap-4 bg-muted/10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[70%] scrollbar-none py-1">
            {breadcrumbs.map((breadcrumb, idx) => (
              <div key={breadcrumb.id || 'root'} className="flex items-center gap-1.5 flex-shrink-0 text-xs">
                {idx > 0 && <span className="text-muted-foreground/60">/</span>}
                <button
                  onClick={() => handleBreadcrumbClick(idx, breadcrumb)}
                  className={`hover:text-primary transition-colors font-serif ${
                    idx === breadcrumbs.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'
                  }`}
                >
                  {breadcrumb.name}
                </button>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search in Drive..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs bg-muted/50 border border-border rounded-sm focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Workspace Body */}
        <div className="flex-1 flex min-h-0">
          
          {/* Sidebar */}
          <div className="w-48 border-r border-border p-4 space-y-1.5 hidden md:block bg-muted/20">
            <button 
              onClick={() => { setSidebarTab('my-drive'); setSearchQuery(''); setCurrentFolderId(null); setBreadcrumbs([{ id: null, name: 'My Drive' }]); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-all ${
                sidebarTab === 'my-drive' && !searchQuery
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Folder className="w-4 h-4" />
              My Drive
            </button>
            <button 
              onClick={() => { setSidebarTab('shared'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-all ${
                sidebarTab === 'shared'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Shared with me
            </button>
            <button 
              onClick={() => { setSidebarTab('starred'); setSearchQuery(''); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-sm text-xs transition-all ${
                sidebarTab === 'starred'
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.88a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.88a1 1 0 00-1.175 0l-3.97 2.88c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118l-3.97-2.88c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
              </svg>
              Starred
            </button>
          </div>

          {/* Files Grid */}
          <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-background/30 relative">
            {loading ? (
              <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                <p className="text-xs text-muted-foreground font-light">Loading items from Google Drive...</p>
              </div>
            ) : errorMsg ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertCircle className="w-12 h-12 text-primary/40 mb-4" />
                <h4 className="font-serif text-lg text-foreground mb-2">An Error Occurred</h4>
                <p className="text-xs text-muted-foreground max-w-md mb-4 leading-relaxed">{errorMsg}</p>
                <button 
                  onClick={() => fetchDriveFiles(currentFolderId, searchQuery, sidebarTab)}
                  className="px-4 py-2 text-xs bg-primary hover:bg-primary/95 text-primary-foreground rounded-sm transition-colors font-medium shadow-sm"
                >
                  Retry Fetch
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <h4 className="font-serif text-lg text-foreground mb-1">No items found</h4>
                <p className="text-xs text-muted-foreground max-w-xs font-light">No files or folders found here. Navigate or try a search.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Folders Grid */}
                {folders.length > 0 && (
                  <div>
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3 font-sans">Folders</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {folders.map(folder => (
                        <div 
                          key={folder.id}
                          onClick={() => navigateToFolder(folder.id, folder.name)}
                          className="flex items-center gap-3 p-3 border border-border/80 rounded-sm hover:bg-muted hover:border-primary/50 cursor-pointer transition-all duration-200 bg-card group"
                        >
                          <div className="p-2 rounded-sm bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                            <Folder className="w-5 h-5 fill-primary/10" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{folder.name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Folder</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Files Grid */}
                {files.length > 0 && (
                  <div>
                    <h5 className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-3 font-sans">Files</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {files.map(file => {
                        const isSelected = selectedFiles.has(file.id)
                        const imageSrc = file.thumbnailLink || file.iconLink || ''
                        return (
                          <div 
                            key={file.id}
                            onClick={() => handleToggleSelect(file)}
                            onDoubleClick={() => handleDoubleClickFile(file)}
                            className={`relative aspect-square border rounded-sm overflow-hidden cursor-pointer transition-all duration-200 group flex flex-col bg-card select-none ${
                              isSelected 
                                ? 'border-primary ring-1 ring-primary/20' 
                                : 'border-border/60 hover:border-primary/30 hover:bg-muted/10'
                            }`}
                          >
                            {/* File Thumbnail */}
                            <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={imageSrc} 
                                alt={file.name}
                                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                  !file.thumbnailLink ? 'max-w-[48px] max-h-[48px] object-contain opacity-60' : ''
                                }`}
                                referrerPolicy="no-referrer"
                                loading="lazy"
                              />
                              
                              {/* Selection overlay */}
                              <div className={`absolute inset-0 bg-primary/5 transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}`} />

                              {/* Selection Indicator checkbox */}
                              <div className={`absolute top-2.5 left-2.5 w-5 h-5 rounded-sm flex items-center justify-center border transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-primary border-primary text-primary-foreground' 
                                  : 'bg-black/30 border-white/50 text-transparent hover:bg-black/50'
                              }`}>
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>

                              <div className="absolute top-2.5 right-2.5 p-1 rounded-sm bg-black/40 text-white/95">
                                <ImageIcon className="w-3.5 h-3.5" />
                              </div>
                            </div>

                            {/* File Info */}
                            <div className="p-2 bg-muted/10 border-t border-border/40 min-w-0">
                              <p className="text-[11px] font-medium text-foreground truncate" title={file.name}>{file.name}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[9px] text-muted-foreground">{formatBytes(file.size)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/40">
          <span className="text-xs text-muted-foreground font-light">
            {selectedFiles.size > 0 
              ? `${selectedFiles.size} file${selectedFiles.size !== 1 ? 's' : ''} selected` 
              : 'Select files to import'}
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleClose}
              className="px-4 py-2 text-xs border border-border hover:bg-muted text-foreground rounded-sm transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button 
              onClick={handleImport}
              disabled={selectedFiles.size === 0}
              className="px-4 py-2 text-xs bg-primary hover:bg-primary/95 disabled:opacity-40 disabled:hover:bg-primary text-primary-foreground rounded-sm transition-colors font-medium shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              Import Selection
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
