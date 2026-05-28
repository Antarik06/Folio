# Graph Report - Folio  (2026-05-28)

## Corpus Check
- 196 files · ~797,275 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 573 nodes · 582 edges · 22 communities detected
- Extraction: 75% EXTRACTED · 25% INFERRED · 0% AMBIGUOUS · INFERRED: 148 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 48 edges
2. `getUser()` - 36 edges
3. `Select()` - 35 edges
4. `update()` - 12 edges
5. `createOrder()` - 12 edges
6. `GET()` - 11 edges
7. `handleSubmit()` - 10 edges
8. `assertManager()` - 9 edges
9. `generateCollaboratorCode()` - 7 edges
10. `getManageableAlbum()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `fetchAlbums()` --calls--> `Select()`  [INFERRED]
  components\album-editor\sidebar.tsx → components\ui\select.tsx
- `handleDeleteEvent()` --calls--> `deleteEvent()`  [INFERRED]
  components\events\event-settings-panel.tsx → lib\actions\events.ts
- `handleGenerateColCode()` --calls--> `generateCollaboratorCode()`  [INFERRED]
  components\events\guest-list.tsx → lib\actions\events.ts
- `signOut()` --calls--> `createClient()`  [INFERRED]
  lib\actions\auth.ts → lib\supabase\server.ts
- `handleSubmit()` --calls--> `createClient()`  [INFERRED]
  app\join\page.tsx → lib\supabase\server.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (42): update(), getProfile(), getUser(), approvePhoto(), assertManager(), assertOwner(), deleteAlbum(), deleteEvent() (+34 more)

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (10): signIn(), signInWithGoogle(), signOut(), signUp(), GoogleIcon(), handleGoogleSignIn(), handleSubmit(), GET() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (8): handlePlaceOrder(), createOrder(), computePriceCents(), getShippingAddressErrors(), isPageCountValid(), validatePostalCode(), validateQuantity(), validateShippingAddress()

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 11 - "Community 11"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 12 - "Community 12"
Cohesion: 0.38
Nodes (4): PreviewPage(), inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (1): fetchAlbums()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 22 - "Community 22"
Cohesion: 0.47
Nodes (4): createAdminClient(), mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 24 - "Community 24"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 25 - "Community 25"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 31 - "Community 31"
Cohesion: 0.5
Nodes (2): updateSession(), proxy()

### Community 44 - "Community 44"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (2): retake(), startCamera()

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 58 - "Community 58"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (7 nodes): `sidebar.tsx`, `fetchAlbums()`, `isVisiblePreset()`, `matchesQuery()`, `readFileAsImage()`, `svgToDataUri()`, `toRemoteImageType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `event-settings-panel.tsx`, `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `FlipBook.tsx`, `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (4 nodes): `middleware.ts`, `updateSession()`, `proxy()`, `proxy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `page.tsx`, `retake()`, `startCamera()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 58`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `PageFlip`, `page-flip.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 3`, `Community 12`, `Community 4`, `Community 22`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `Select()` connect `Community 0` to `Community 3`, `Community 4`, `Community 10`, `Community 12`, `Community 13`, `Community 22`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 3`, `Community 4`, `Community 31`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `createClient()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`createClient()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`getUser()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `Select()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`Select()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `update()` (e.g. with `handleSave()` and `updateEventSettings()`) actually correct?**
  _`update()` has 11 INFERRED edges - model-reasoned connections that need verification._