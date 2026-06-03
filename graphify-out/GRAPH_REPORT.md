# Graph Report - Folio  (2026-06-03)

## Corpus Check
- 188 files · ~161,216 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 559 nodes · 590 edges · 22 communities detected
- Extraction: 73% EXTRACTED · 27% INFERRED · 0% AMBIGUOUS · INFERRED: 162 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 48 edges
2. `getUser()` - 38 edges
3. `Select()` - 35 edges
4. `GET()` - 18 edges
5. `update()` - 12 edges
6. `createOrder()` - 12 edges
7. `handleSubmit()` - 11 edges
8. `POST()` - 9 edges
9. `assertManager()` - 9 edges
10. `generateCollaboratorCode()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `handleDeleteEvent()` --calls--> `deleteEvent()`  [INFERRED]
  components\events\event-settings-panel.tsx → lib\actions\events.ts
- `handleGenerateColCode()` --calls--> `generateCollaboratorCode()`  [INFERRED]
  components\events\guest-list.tsx → lib\actions\events.ts
- `signOut()` --calls--> `createClient()`  [INFERRED]
  lib\actions\auth.ts → lib\supabase\server.ts
- `handleSubmit()` --calls--> `createClient()`  [INFERRED]
  app\join\page.tsx → lib\supabase\server.ts
- `handleSubmit()` --calls--> `getUser()`  [INFERRED]
  app\join\page.tsx → lib\actions\auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (40): update(), getProfile(), getUser(), approvePhoto(), assertManager(), assertOwner(), deleteAlbum(), deleteEvent() (+32 more)

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (12): signIn(), signInWithGoogle(), signOut(), signUp(), GoogleIcon(), handleGoogleSignIn(), handleSubmit(), TemplatesPage() (+4 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 4 - "Community 4"
Cohesion: 0.21
Nodes (8): handlePlaceOrder(), createOrder(), computePriceCents(), getShippingAddressErrors(), isPageCountValid(), validatePostalCode(), validateQuantity(), validateShippingAddress()

### Community 5 - "Community 5"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 8 - "Community 8"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 9 - "Community 9"
Cohesion: 0.22
Nodes (3): Alert(), handleFileUpload(), handleSave()

### Community 12 - "Community 12"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 13 - "Community 13"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 15 - "Community 15"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 18 - "Community 18"
Cohesion: 0.47
Nodes (4): createAdminClient(), mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 23 - "Community 23"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 24 - "Community 24"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 30 - "Community 30"
Cohesion: 0.6
Nodes (3): inferAlbumProductType(), inferTemplateProductType(), isProductType()

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

### Community 56 - "Community 56"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 110 - "Community 110"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 5`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 8`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 13`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (5 nodes): `event-settings-panel.tsx`, `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (5 nodes): `FlipBook.tsx`, `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (4 nodes): `middleware.ts`, `updateSession()`, `proxy()`, `proxy.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `page.tsx`, `retake()`, `startCamera()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 56`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 110`** (2 nodes): `PageFlip`, `page-flip.d.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 1`, `Community 18`, `Community 4`, `Community 9`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Select()` connect `Community 0` to `Community 1`, `Community 18`, `Community 11`, `Community 4`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 1`, `Community 4`, `Community 9`, `Community 31`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 47 inferred relationships involving `createClient()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`createClient()` has 47 INFERRED edges - model-reasoned connections that need verification._
- **Are the 36 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`getUser()` has 36 INFERRED edges - model-reasoned connections that need verification._
- **Are the 34 inferred relationships involving `Select()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`Select()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `GET()` (e.g. with `handleSubmit()` and `POST()`) actually correct?**
  _`GET()` has 13 INFERRED edges - model-reasoned connections that need verification._