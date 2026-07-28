# Graph Report - Folio  (2026-07-28)

## Corpus Check
- 199 files · ~306,225 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 604 nodes · 772 edges · 28 communities detected
- Extraction: 65% EXTRACTED · 35% INFERRED · 0% AMBIGUOUS · INFERRED: 272 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 84|Community 84]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 55 edges
2. `getAuthToken()` - 51 edges
3. `createClient()` - 50 edges
4. `getUser()` - 41 edges
5. `GET()` - 24 edges
6. `update()` - 11 edges
7. `isUuid()` - 10 edges
8. `createOrder()` - 10 edges
9. `query()` - 9 edges
10. `handleSubmit()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `fetchWithLimits()` --calls--> `GET()`  [INFERRED]
  backend\src\utils\safeFetch.ts → frontend\app\auth\callback\route.ts
- `SharedAlbumPage()` --calls--> `getAlbumAspectRatio()`  [INFERRED]
  frontend\app\album\share\[token]\page.tsx → frontend\lib\template-engine-utils.ts
- `GET()` --calls--> `fetchAlbums()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\album-editor\sidebar.tsx
- `GET()` --calls--> `loadTemplates()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\artist\artist-dashboard-client.tsx
- `GET()` --calls--> `loadStats()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\artist\artist-dashboard-client.tsx

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (62): assignArtistToOrder(), assignArtistToPremiumProject(), createPromoCode(), deletePromoCode(), getAdminArtists(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders() (+54 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (23): getProfile(), homeForRole(), signIn(), signInWithGoogle(), signOut(), signUp(), autoSelect(), EditorPage() (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (17): hasAlbumColumn(), ensureAdminProfile(), authMiddleware(), loadProfile(), verifyToken(), generateUniqueCode(), randomCode(), getClient() (+9 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (18): cleanExternalUrl(), fetchAndDetectFormat(), fileToBase64(), handleParseIdml(), handleReviewAction(), handleUploadPdf(), handleUploadThumb(), loadPdfjs() (+10 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (11): handleApplyPromo(), handlePlaceOrder(), loadScript(), createOrder(), loadSettings(), loadSettings(), getShippingAddressErrors(), validatePostalCode() (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (5): handleCreateFolder(), handleDeleteFolder(), handleMovePhoto(), handleUpdateLocation(), handleUpdateTags()

### Community 8 - "Community 8"
Cohesion: 0.2
Nodes (11): authenticateGoogleDrive(), loadGoogleScripts(), convertHeicToJpeg(), convertTiffToJpeg(), handleFileUpload(), handleGoogleDriveImport(), loadCdnScript(), loadHeicToScript() (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.23
Nodes (7): handleDeleteSlot(), handleDragEnd(), handleMouseUp(), handleTransformEnd(), handleUpdateSlotField(), pxToMm(), setSlots()

### Community 10 - "Community 10"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 12 - "Community 12"
Cohesion: 0.28
Nodes (4): generateTextures(), renderToCanvas(), gen(), renderToCanvas()

### Community 13 - "Community 13"
Cohesion: 0.32
Nodes (3): handleClose(), handleDoubleClickFile(), handleImport()

### Community 14 - "Community 14"
Cohesion: 0.29
Nodes (1): fetchAlbums()

### Community 15 - "Community 15"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (4): createAdminClient(), spreadsToFlipbookPages(), normalizeSpreads(), SharedAlbumPage()

### Community 17 - "Community 17"
Cohesion: 0.6
Nodes (5): assertSafeExternalUrl(), fetchWithLimits(), isPrivateAddress(), isPrivateIpv4(), isPrivateIpv6()

### Community 19 - "Community 19"
Cohesion: 0.7
Nodes (4): collectFrames(), parseBounds(), parseIDML(), parseTransform()

### Community 21 - "Community 21"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 22 - "Community 22"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 26 - "Community 26"
Cohesion: 0.6
Nodes (3): inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): middleware(), updateSession()

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (2): errorMiddleware(), inferStatus()

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (2): sendError(), statusForError()

### Community 35 - "Community 35"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (2): retake(), startCamera()

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 84 - "Community 84"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 10`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (7 nodes): `sidebar.tsx`, `fetchAlbums()`, `isVisiblePreset()`, `matchesQuery()`, `readFileAsImage()`, `svgToDataUri()`, `toRemoteImageType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (4 nodes): `middleware.ts`, `middleware.ts`, `middleware()`, `updateSession()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (3 nodes): `errorMiddleware.ts`, `errorMiddleware()`, `inferStatus()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (3 nodes): `httpError.ts`, `sendError()`, `statusForError()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (3 nodes): `page.tsx`, `retake()`, `startCamera()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 84`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 0` to `Community 16`, `Community 1`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **Why does `GET()` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 14`, `Community 17`?**
  _High betweenness centrality (0.063) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 8`, `Community 1`, `Community 27`, `Community 4`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `serverFetch()` (e.g. with `ArtistDashboardPage()` and `EventSettingsPage()`) actually correct?**
  _`serverFetch()` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 48 inferred relationships involving `getAuthToken()` (e.g. with `ArtistDashboardPage()` and `EventSettingsPage()`) actually correct?**
  _`getAuthToken()` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 49 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `UnifiedCheckoutPage()`) actually correct?**
  _`createClient()` has 49 INFERRED edges - model-reasoned connections that need verification._
- **Are the 39 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `AdminDashboardPage()`) actually correct?**
  _`getUser()` has 39 INFERRED edges - model-reasoned connections that need verification._