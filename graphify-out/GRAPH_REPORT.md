# Graph Report - Folio  (2026-06-06)

## Corpus Check
- 247 files · ~317,497 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 777 nodes · 965 edges · 28 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 288 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 126|Community 126]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 59 edges
2. `createClient()` - 53 edges
3. `getUser()` - 44 edges
4. `Select()` - 30 edges
5. `getAuthToken()` - 29 edges
6. `GET()` - 25 edges
7. `getAuthToken()` - 18 edges
8. `Alert()` - 16 edges
9. `createOrder()` - 14 edges
10. `query()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `SharedAlbumPage()` --calls--> `getAlbumAspectRatio()`  [INFERRED]
  frontend\app\album\share\[token]\page.tsx → frontend\lib\template-engine-utils.ts
- `GET()` --calls--> `loadTemplates()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\artist\artist-dashboard-client.tsx
- `GET()` --calls--> `loadStats()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\artist\artist-dashboard-client.tsx
- `handleDeleteEvent()` --calls--> `deleteEvent()`  [INFERRED]
  frontend\components\events\event-settings-panel.tsx → frontend\lib\actions\events.ts
- `handleGenerateColCode()` --calls--> `generateCollaboratorCode()`  [INFERRED]
  frontend\components\events\guest-list.tsx → frontend\lib\actions\events.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (49): update(), clientFetch(), serverFetch(), getProfile(), getUser(), approvePhoto(), createAlbumAction(), createFolderAction() (+41 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (25): Alert(), cleanExternalUrl(), fetchAndDetectFormat(), fileToBase64(), handleParseIdml(), handleReviewAction(), handleUploadPdf(), handleUploadThumb() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (22): signIn(), signInWithGoogle(), signOut(), signUp(), autoSelect(), EditorPage(), GoogleIcon(), handleCreateAlbumFromCuration() (+14 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (19): run(), run(), assertArtist(), authMiddleware(), check(), ensureAdminProfile(), getClient(), query() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (13): handlePlaceOrder(), loadScript(), createOrder(), getAuthToken(), getUserOrders(), verifyPayment(), computePriceCents(), formatPrice() (+5 more)

### Community 6 - "Community 6"
Cohesion: 0.19
Nodes (18): assignArtistToOrder(), assignArtistToPremiumProject(), createPromoCode(), deletePromoCode(), getAdminArtists(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders() (+10 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 8 - "Community 8"
Cohesion: 0.24
Nodes (11): authenticateGoogleDrive(), loadGoogleScripts(), convertHeicToJpeg(), convertTiffToJpeg(), handleFileUpload(), handleGoogleDriveImport(), loadCdnScript(), loadHeicToScript() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (7): handleDeleteSlot(), handleDragEnd(), handleMouseUp(), handleTransformEnd(), handleUpdateSlotField(), pxToMm(), setSlots()

### Community 10 - "Community 10"
Cohesion: 0.15
Nodes (5): handleApplyPromo(), loadSettings(), loadSettings(), getSystemSettings(), validatePromoCode()

### Community 11 - "Community 11"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 17 - "Community 17"
Cohesion: 0.32
Nodes (3): handleClose(), handleDoubleClickFile(), handleImport()

### Community 18 - "Community 18"
Cohesion: 0.32
Nodes (4): generateTextures(), renderToCanvas(), gen(), renderToCanvas()

### Community 19 - "Community 19"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 20 - "Community 20"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 23 - "Community 23"
Cohesion: 0.33
Nodes (4): createAdminClient(), spreadsToFlipbookPages(), normalizeSpreads(), SharedAlbumPage()

### Community 26 - "Community 26"
Cohesion: 0.7
Nodes (4): collectFrames(), parseBounds(), parseIDML(), parseTransform()

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 33 - "Community 33"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 37 - "Community 37"
Cohesion: 0.6
Nodes (3): inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 50 - "Community 50"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (2): retake(), startCamera()

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 66 - "Community 66"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 126 - "Community 126"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (3 nodes): `page.tsx`, `retake()`, `startCamera()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 66`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 126`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 1`, `Community 2`, `Community 5`, `Community 23`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **Why does `serverFetch()` connect `Community 0` to `Community 2`, `Community 5`, `Community 6`, `Community 10`, `Community 23`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 8`, `Community 2`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Are the 58 inferred relationships involving `serverFetch()` (e.g. with `ArtistDashboardPage()` and `EventSettingsPage()`) actually correct?**
  _`serverFetch()` has 58 INFERRED edges - model-reasoned connections that need verification._
- **Are the 52 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `EventSettingsPage()`) actually correct?**
  _`createClient()` has 52 INFERRED edges - model-reasoned connections that need verification._
- **Are the 42 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `AdminDashboardPage()`) actually correct?**
  _`getUser()` has 42 INFERRED edges - model-reasoned connections that need verification._
- **Are the 29 inferred relationships involving `Select()` (e.g. with `DashboardLayout()` and `handleSubmit()`) actually correct?**
  _`Select()` has 29 INFERRED edges - model-reasoned connections that need verification._