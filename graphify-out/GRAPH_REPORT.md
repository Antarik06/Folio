# Graph Report - Folio  (2026-06-03)

## Corpus Check
- 226 files · ~279,648 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 671 nodes · 790 edges · 25 communities detected
- Extraction: 69% EXTRACTED · 31% INFERRED · 0% AMBIGUOUS · INFERRED: 245 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 55 edges
2. `createClient()` - 47 edges
3. `getUser()` - 43 edges
4. `Select()` - 31 edges
5. `getAuthToken()` - 29 edges
6. `GET()` - 19 edges
7. `getAuthToken()` - 14 edges
8. `createOrder()` - 14 edges
9. `update()` - 12 edges
10. `handleSubmit()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `handleDeleteEvent()` --calls--> `deleteEvent()`  [INFERRED]
  frontend\components\events\event-settings-panel.tsx → frontend\lib\actions\events.ts
- `handleGenerateColCode()` --calls--> `generateCollaboratorCode()`  [INFERRED]
  frontend\components\events\guest-list.tsx → frontend\lib\actions\events.ts
- `signOut()` --calls--> `createClient()`  [INFERRED]
  frontend\lib\actions\auth.ts → frontend\lib\supabase\server.ts
- `AdminDashboardPage()` --calls--> `getUser()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\admin\page.tsx → frontend\lib\actions\auth.ts
- `ArtistDashboardPage()` --calls--> `getProfile()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\artist\page.tsx → frontend\lib\actions\auth.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (50): update(), spreadsToFlipbookPages(), clientFetch(), serverFetch(), getProfile(), getUser(), approvePhoto(), createAlbumAction() (+42 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (18): Alert(), authenticateGoogleDrive(), loadGoogleScripts(), handleCreateFolder(), handleDeleteFolder(), handleMovePhoto(), handleUpdateLocation(), handleUpdateTags() (+10 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (13): signIn(), signInWithGoogle(), signOut(), signUp(), ArtistDashboardPage(), autoSelect(), GoogleIcon(), handleEventClick() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.19
Nodes (13): handlePlaceOrder(), loadScript(), createOrder(), getAuthToken(), getUserOrders(), verifyPayment(), computePriceCents(), formatPrice() (+5 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 6 - "Community 6"
Cohesion: 0.23
Nodes (14): createPromoCode(), deletePromoCode(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders(), getAdminSettings(), getAdminUserEvents(), getAdminUsers() (+6 more)

### Community 7 - "Community 7"
Cohesion: 0.15
Nodes (5): handleApplyPromo(), loadSettings(), loadSettings(), getSystemSettings(), validatePromoCode()

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (5): authMiddleware(), ensureAdminProfile(), getClient(), query(), runMigrations()

### Community 15 - "Community 15"
Cohesion: 0.32
Nodes (3): handleClose(), handleDoubleClickFile(), handleImport()

### Community 16 - "Community 16"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 21 - "Community 21"
Cohesion: 0.47
Nodes (4): createAdminClient(), mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 28 - "Community 28"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 32 - "Community 32"
Cohesion: 0.6
Nodes (3): inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (2): retake(), startCamera()

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 8`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (3 nodes): `page.tsx`, `retake()`, `startCamera()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `serverFetch()` connect `Community 0` to `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 21`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 6`?**
  _High betweenness centrality (0.023) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 0` to `Community 1`, `Community 2`, `Community 4`, `Community 21`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `serverFetch()` (e.g. with `ArtistDashboardPage()` and `EventSettingsPage()`) actually correct?**
  _`serverFetch()` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 46 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `EventSettingsPage()`) actually correct?**
  _`createClient()` has 46 INFERRED edges - model-reasoned connections that need verification._
- **Are the 41 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `AdminDashboardPage()`) actually correct?**
  _`getUser()` has 41 INFERRED edges - model-reasoned connections that need verification._
- **Are the 30 inferred relationships involving `Select()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`Select()` has 30 INFERRED edges - model-reasoned connections that need verification._