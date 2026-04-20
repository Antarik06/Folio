import React from 'react'
import {
  LayoutTemplate,
  Images,
  Shapes,
  UploadCloud,
  Type,
  PenTool,
  FolderOpen,
  Check,
} from 'lucide-react'

type SidebarPanel = 'design' | 'elements' | 'photos' | 'uploads' | 'text'

interface SidebarProps {
  activePanel: SidebarPanel
  onChangePanel: (p: SidebarPanel) => void
  onAddElement: (el: any) => void
  photos?: any[]
  onGoBack: () => void
  spreadBackground?: string
  onSetSpreadBackground?: (color: string) => void
}

const TABS: { id: string; label: string; icon: any; disabled?: boolean }[] = [
  { id: 'design', label: 'Design', icon: LayoutTemplate },
  { id: 'elements', label: 'Elements', icon: Shapes },
  { id: 'photos', label: 'Photos', icon: Images },
  { id: 'uploads', label: 'Uploads', icon: UploadCloud },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'draw', label: 'Draw', icon: PenTool, disabled: true },
  { id: 'projects', label: 'Projects', icon: FolderOpen, disabled: true },
]

const DRAG_MIME = 'application/x-folio-album-element'
const PAGE_COLORS = ['#FFFFFF', '#F8F4EC', '#F3E9DD', '#EAD7C0', '#DDE8E3', '#E7E7F3', '#FCE8E8', '#1C1814']

function isHexColor(value: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value)
}

export function Sidebar({
  activePanel,
  onChangePanel,
  onAddElement,
  photos = [],
  onGoBack,
  spreadBackground = '#FFFFFF',
  onSetSpreadBackground,
}: SidebarProps) {
  const [selectedPhotoIds, setSelectedPhotoIds] = React.useState<Set<string>>(new Set())
  const [localUploads, setLocalUploads] = React.useState<Array<{
    id: string
    name: string
    src: string
    width: number
    height: number
  }>>([])
  const localUploadUrlsRef = React.useRef<string[]>([])
  const [customPageColor, setCustomPageColor] = React.useState(spreadBackground)

  const startDrag = (event: React.DragEvent<HTMLElement>, payload: any) => {
    const serialized = JSON.stringify(payload)
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(DRAG_MIME, serialized)
    event.dataTransfer.setData('text/plain', serialized)
  }

  const toImageElement = React.useCallback((src: string, rawW: number, rawH: number, indexOffset = 0) => {
    const maxDim = 300
    const safeW = rawW > 0 ? rawW : 600
    const safeH = rawH > 0 ? rawH : 400
    const aspect = safeW / safeH

    let width = maxDim
    let height = maxDim / aspect
    if (height > maxDim) {
      height = maxDim
      width = maxDim * aspect
    }

    return {
      type: 'image',
      src,
      x: 100 + indexOffset * 24,
      y: 100 + indexOffset * 24,
      width,
      height,
      rotation: 0,
    }
  }, [])

  const togglePhotoSelection = React.useCallback((photoId: string) => {
    setSelectedPhotoIds((prev) => {
      const next = new Set(prev)
      if (next.has(photoId)) next.delete(photoId)
      else next.add(photoId)
      return next
    })
  }, [])

  React.useEffect(() => {
    const currentPhotoIds = new Set(photos.map((photo) => photo.id))
    setSelectedPhotoIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (currentPhotoIds.has(id)) next.add(id)
      })
      return next
    })
  }, [photos])

  React.useEffect(() => {
    return () => {
      localUploadUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  React.useEffect(() => {
    setCustomPageColor(spreadBackground)
  }, [spreadBackground])

  const handleUploadFromComputer = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const readFileAsImage = (file: File) =>
      new Promise<{ id: string; name: string; src: string; width: number; height: number }>((resolve) => {
        const src = URL.createObjectURL(file)
        const img = new Image()

        img.onload = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src,
            width: img.naturalWidth || 600,
            height: img.naturalHeight || 400,
          })
        }

        img.onerror = () => {
          resolve({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            src,
            width: 600,
            height: 400,
          })
        }

        img.src = src
      })

    const nextUploads = await Promise.all(Array.from(files).map((file) => readFileAsImage(file)))
    localUploadUrlsRef.current.push(...nextUploads.map((item) => item.src))
    setLocalUploads((prev) => [...nextUploads, ...prev])
    event.target.value = ''
  }, [])

  const addSelectedPhotos = React.useCallback(() => {
    const selected = photos.filter((photo) => selectedPhotoIds.has(photo.id))
    if (selected.length === 0) return

    selected.forEach((photo, index) => {
      onAddElement(
        toImageElement(
          photo.blob_url,
          photo.width || 600,
          photo.height || 400,
          index
        )
      )
    })
  }, [onAddElement, photos, selectedPhotoIds, toImageElement])

  const applyCustomBackground = React.useCallback(() => {
    const normalized = customPageColor.trim()
    if (!isHexColor(normalized) || !onSetSpreadBackground) return
    onSetSpreadBackground(normalized.toUpperCase())
  }, [customPageColor, onSetSpreadBackground])

  return (
    <div className="flex h-full bg-[#18191B] dark:bg-[#0F0D0B] flex-shrink-0 z-20 transition-colors">
      
      {/* Very thin left icon rail */}
      <div className="flex flex-col items-center w-[72px] border-r border-white/10 pt-4 h-full bg-black/90">
        {/* Brand or Back btn */}
        <button
          type="button"
          onClick={onGoBack}
          className="mb-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white font-serif font-bold text-lg hover:bg-white/20 transition-colors"
          title="Back"
          aria-label="Back to website"
        >
          F
        </button>

        {TABS.map((t) => {
          const Icon = t.icon
          const isActive = activePanel === t.id
          
          return (
            <button
              key={t.id}
              disabled={t.disabled}
              onClick={() => !t.disabled && onChangePanel(t.id as any)}
              className={`flex flex-col items-center justify-center w-full py-3 px-1 transition-colors group relative ${
                isActive ? 'text-white bg-white/10' : 'text-white/60 hover:text-white hover:bg-white/5'
              } ${t.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isActive && (
                 <div className="absolute left-0 w-[3px] top-2 bottom-2 rounded-r bg-white" />
              )}
              <Icon className="w-[22px] h-[22px] mb-1.5 stroke-[1.5]" />
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* Expanded properties panel */}
      <div className="w-[320px] border-r border-[#E5E5E5] dark:border-[#3a342b] bg-white dark:bg-[#171511] h-full overflow-y-auto flex flex-col p-4 z-10 shadow-[1px_0_10px_rgba(0,0,0,0.05)] transition-colors">

        {activePanel === 'design' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-3">Design</h2>
            <p className="text-xs text-muted-foreground mb-5">Set page look first, then add photos, elements, and text.</p>

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Page color</h3>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {PAGE_COLORS.map((color) => {
                    const isActive = spreadBackground.toLowerCase() === color.toLowerCase()
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => onSetSpreadBackground?.(color)}
                        className={`h-9 rounded border transition-all ${isActive ? 'ring-2 ring-terracotta border-terracotta' : 'border-black/10 dark:border-white/20 hover:scale-[1.03]'}`}
                        style={{ backgroundColor: color }}
                        title={`Set page color ${color}`}
                        aria-label={`Set page color ${color}`}
                      />
                    )
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={isHexColor(customPageColor) ? customPageColor : '#FFFFFF'}
                    onChange={(event) => {
                      setCustomPageColor(event.target.value.toUpperCase())
                      onSetSpreadBackground?.(event.target.value.toUpperCase())
                    }}
                    className="h-10 w-10 rounded border border-black/10 dark:border-white/20 bg-transparent p-1 cursor-pointer"
                    aria-label="Choose custom page color"
                  />
                  <input
                    type="text"
                    value={customPageColor}
                    onChange={(event) => setCustomPageColor(event.target.value)}
                    onBlur={applyCustomBackground}
                    className="h-10 flex-1 rounded border border-black/10 dark:border-white/20 bg-white dark:bg-[#201c16] px-3 text-sm"
                    placeholder="#FFFFFF"
                    aria-label="Page color hex value"
                  />
                  <button
                    type="button"
                    onClick={applyCustomBackground}
                    className="h-10 px-3 rounded bg-terracotta text-white text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-black/10 dark:border-white/10 p-3">
                <h4 className="text-sm font-semibold text-foreground mb-2">Workflow tip</h4>
                <p className="text-xs text-muted-foreground">For a faster flow: choose page color in Design, place visual blocks in Elements, then add heading/body in Text.</p>
              </div>
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}
        
        {activePanel === 'elements' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-6">Elements</h2>
            <p className="text-xs text-muted-foreground mb-5">Use for structure: shapes, dividers, and frames behind photos/text.</p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Shapes</h3>
                <div className="grid grid-cols-3 gap-3">
                  {/* Rectangle */}
                  <button
                    className="aspect-square bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded flex items-center justify-center border border-gray-200 dark:border-[#3a342b] transition-colors"
                    draggable
                    onDragStart={(event) => startDrag(event, {
                      type: 'shape',
                      shapeType: 'rectangle',
                      fill: '#D54D34',
                      x: 100, y: 100, width: 100, height: 100, rotation: 0
                    })}
                    onClick={() => onAddElement({
                      type: 'shape',
                      shapeType: 'rectangle',
                      fill: '#D54D34',
                      x: 100, y: 100, width: 100, height: 100, rotation: 0
                    })}
                  >
                    <div className="w-10 h-10 bg-terracotta rounded-sm" />
                  </button>

                  {/* Circle */}
                  <button
                    className="aspect-square bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded flex items-center justify-center border border-gray-200 dark:border-[#3a342b] transition-colors"
                    draggable
                    onDragStart={(event) => startDrag(event, {
                      type: 'shape',
                      shapeType: 'circle',
                      fill: '#153A30',
                      x: 150, y: 150, width: 100, height: 100, rotation: 0
                    })}
                    onClick={() => onAddElement({
                      type: 'shape',
                      shapeType: 'circle',
                      fill: '#153A30',
                      x: 150, y: 150, width: 100, height: 100, rotation: 0
                    })}
                  >
                    <div className="w-10 h-10 bg-bottle rounded-full" />
                  </button>
                  
                  {/* Line */}
                  <button
                    className="aspect-square bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded flex items-center justify-center border border-gray-200 dark:border-[#3a342b] transition-colors"
                    draggable
                    onDragStart={(event) => startDrag(event, {
                      type: 'shape',
                      shapeType: 'line',
                      stroke: '#1C1814',
                      strokeWidth: 4,
                      x: 200, y: 100, width: 120, height: 0, rotation: 0
                    })}
                    onClick={() => onAddElement({
                      type: 'shape',
                      shapeType: 'line',
                      stroke: '#1C1814',
                      strokeWidth: 4,
                      x: 200, y: 100, width: 120, height: 0, rotation: 0
                    })}
                  >
                    <div className="w-12 h-1 bg-ink" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Frames</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="h-16 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded border border-gray-200 dark:border-[#3a342b] transition-colors"
                    draggable
                    onDragStart={(event) => startDrag(event, {
                      type: 'shape',
                      shapeType: 'rectangle',
                      fill: '#FFFFFF',
                      stroke: '#1C1814',
                      strokeWidth: 2,
                      x: 120,
                      y: 120,
                      width: 340,
                      height: 260,
                      rotation: 0,
                    })}
                    onClick={() => onAddElement({
                      type: 'shape',
                      shapeType: 'rectangle',
                      fill: '#FFFFFF',
                      stroke: '#1C1814',
                      strokeWidth: 2,
                      x: 120,
                      y: 120,
                      width: 340,
                      height: 260,
                      rotation: 0,
                    })}
                  >
                    <div className="mx-auto h-10 w-14 border-2 border-black/60 rounded" />
                  </button>

                  <button
                    className="h-16 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] rounded border border-gray-200 dark:border-[#3a342b] transition-colors"
                    draggable
                    onDragStart={(event) => startDrag(event, {
                      type: 'shape',
                      shapeType: 'line',
                      stroke: '#1C1814',
                      strokeWidth: 2,
                      x: 120,
                      y: 180,
                      width: 360,
                      height: 0,
                      rotation: 0,
                    })}
                    onClick={() => onAddElement({
                      type: 'shape',
                      shapeType: 'line',
                      stroke: '#1C1814',
                      strokeWidth: 2,
                      x: 120,
                      y: 180,
                      width: 360,
                      height: 0,
                      rotation: 0,
                    })}
                  >
                    <div className="mx-auto h-[2px] w-20 bg-black/70" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'photos' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif text-foreground">Photos</h2>
              {selectedPhotoIds.size > 0 && (
                <button
                  type="button"
                  onClick={addSelectedPhotos}
                  className="text-xs px-3 py-1.5 rounded bg-terracotta text-white hover:opacity-90 transition-opacity"
                >
                  Add {selectedPhotoIds.size}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-4">Tick multiple photos, then click Add.</p>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {photos.length > 0 ? (
                photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square bg-gray-100 dark:bg-[#201c16] rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-terracotta"
                    draggable
                    onDragStart={(event) => {
                      startDrag(event, toImageElement(photo.blob_url, photo.width || 600, photo.height || 400))
                    }}
                    onClick={() => {
                      onAddElement(toImageElement(photo.blob_url, photo.width || 600, photo.height || 400))
                    }}
                  >
                    <img 
                      src={photo.thumbnail_url || photo.blob_url} 
                      alt="Uploaded" 
                      className="w-full h-full object-cover" 
                    />

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        togglePhotoSelection(photo.id)
                      }}
                      className={`absolute top-1.5 right-1.5 h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                        selectedPhotoIds.has(photo.id)
                          ? 'bg-terracotta border-terracotta text-white'
                          : 'bg-black/45 border-white/60 text-white'
                      }`}
                      title="Select photo"
                      aria-label="Select photo"
                    >
                      {selectedPhotoIds.has(photo.id) && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">No photos in this event.</p>
                  <p className="text-xs text-muted-foreground/80">Go back to the event to upload some!</p>
                </div>
              )}
            </div>

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'uploads' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-4">Uploads</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Upload from your computer: images, stickers, or visual elements.
            </p>

            <label className="mb-5 p-4 border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-[#201c16] transition-colors">
              <input
                type="file"
                accept="image/*,.svg"
                multiple
                className="hidden"
                onChange={handleUploadFromComputer}
              />
              <div className="text-sm font-medium text-foreground">Choose files</div>
              <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP, SVG</div>
            </label>

            {localUploads.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 pb-8">
                {localUploads.map((item) => (
                  <div
                    key={item.id}
                    className="aspect-square bg-gray-100 dark:bg-[#201c16] rounded-md overflow-hidden cursor-pointer hover:ring-2 hover:ring-terracotta"
                    draggable
                    onDragStart={(event) => startDrag(event, toImageElement(item.src, item.width, item.height))}
                    onClick={() => onAddElement(toImageElement(item.src, item.width, item.height))}
                  >
                    <img src={item.src} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border-2 border-dashed border-[#DDD8CE] dark:border-[#3a342b] rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">No local uploads yet.</p>
                <p className="text-xs text-muted-foreground/80">Upload a file and click/drag to place it on canvas.</p>
              </div>
            )}

            <div className="mt-auto h-0" />
          </div>
        )}

        {activePanel === 'text' && (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-left-4 duration-300">
            <h2 className="text-xl font-serif text-foreground mb-6">Text</h2>
            <p className="text-xs text-muted-foreground mb-4">Use heading, subheading, and body blocks for faster typography layout.</p>
            
            <div className="space-y-3">
              <button 
                className="w-full py-4 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center font-bold text-3xl font-serif transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a heading',
                  fontSize: 72,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  x: 50, y: 50, width: 600, height: 90, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a heading',
                  fontSize: 72,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  x: 50, y: 50, width: 600, height: 90, rotation: 0
                })}
              >
                Add a heading
              </button>
              
              <button 
                className="w-full py-3 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center font-semibold text-xl font-sans transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a subheading',
                  fontSize: 48,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'left',
                  x: 50, y: 150, width: 400, height: 60, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a subheading',
                  fontSize: 48,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'left',
                  x: 50, y: 150, width: 400, height: 60, rotation: 0
                })}
              >
                Add a subheading
              </button>
              
              <button 
                className="w-full py-2 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center text-sm font-sans transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: 'Add a little bit of body text',
                  fontSize: 24,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 50, y: 250, width: 400, height: 40, rotation: 0
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: 'Add a little bit of body text',
                  fontSize: 24,
                  fontFamily: 'sans-serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 50, y: 250, width: 400, height: 40, rotation: 0
                })}
              >
                Add a little bit of body text
              </button>

              <button
                className="w-full py-2 bg-gray-50 dark:bg-[#201c16] hover:bg-gray-100 dark:hover:bg-[#2c261f] text-foreground rounded flex items-center justify-center text-base italic font-serif transition-colors"
                draggable
                onDragStart={(event) => startDrag(event, {
                  type: 'text',
                  text: '"A meaningful quote goes here."',
                  fontSize: 34,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 120,
                  y: 320,
                  width: 500,
                  height: 80,
                  rotation: 0,
                })}
                onClick={() => onAddElement({
                  type: 'text',
                  text: '"A meaningful quote goes here."',
                  fontSize: 34,
                  fontFamily: 'serif',
                  fill: '#1C1814',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  x: 120,
                  y: 320,
                  width: 500,
                  height: 80,
                  rotation: 0,
                })}
              >
                Add a quote
              </button>
            </div>
            
          </div>
        )}

      </div>
    </div>
  )
}