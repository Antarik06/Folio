# Graph Report - Folio  (2026-06-03)

## Corpus Check
- 226 files · ~276,951 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 669 nodes · 691 edges · 24 communities detected
- Extraction: 78% EXTRACTED · 22% INFERRED · 0% AMBIGUOUS · INFERRED: 150 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 117|Community 117]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 55 edges
2. `getAuthToken()` - 29 edges
3. `getUser()` - 23 edges
4. `createClient()` - 22 edges
5. `GET()` - 17 edges
6. `getAuthToken()` - 14 edges
7. `Alert()` - 10 edges
8. `handleSubmit()` - 9 edges
9. `getAuthToken()` - 8 edges
10. `UnifiedCheckoutPage()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `fetchAlbums()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\album-editor\sidebar.tsx
- `AdminDashboardPage()` --calls--> `getUser()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\admin\page.tsx → frontend\lib\actions\auth.ts
- `ArtistDashboardPage()` --calls--> `serverFetch()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\artist\page.tsx → frontend\lib\api-client.ts
- `EventSettingsPage()` --calls--> `serverFetch()`  [INFERRED]
  frontend\app\(dashboard)\events\[id]\settings\page.tsx → frontend\lib\api-client.ts
- `UnifiedCheckoutPage()` --calls--> `getSystemSettings()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\orders\checkout\page.tsx → frontend\lib\actions\settings.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (30): createAdminClient(), spreadsToFlipbookPages(), clientFetch(), getProfile(), getUser(), signIn(), signInWithGoogle(), signOut() (+22 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (43): createPromoCode(), deletePromoCode(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders(), getAdminSettings(), getAdminUserEvents(), getAdminUsers() (+35 more)

### Community 2 - "Community 2"
Cohesion: 0.07
Nodes (18): Alert(), authenticateGoogleDrive(), loadGoogleScripts(), handleCreateFolder(), handleDeleteFolder(), handleMovePhoto(), handleUpdateLocation(), handleUpdateTags() (+10 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (12): handleApplyPromo(), handlePlaceOrder(), loadScript(), createOrder(), getAlbumOrder(), getAuthToken(), getUserOrders(), verifyPayment() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (7): computePriceCents(), formatPrice(), getShippingAddressErrors(), isPageCountValid(), validatePostalCode(), validateQuantity(), validateShippingAddress()

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (5): authMiddleware(), ensureAdminProfile(), getClient(), query(), runMigrations()

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (3): handleClose(), handleDoubleClickFile(), handleImport()

### Community 15 - "Community 15"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (1): fetchAlbums()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 18 - "Community 18"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 25 - "Community 25"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 26 - "Community 26"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 27 - "Community 27"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 31 - "Community 31"
Cohesion: 0.6
Nodes (3): inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 32 - "Community 32"
Cohesion: 0.83
Nodes (3): mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 45 - "Community 45"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 59 - "Community 59"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 117 - "Community 117"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (7 nodes): `sidebar.tsx`, `fetchAlbums()`, `isVisiblePreset()`, `matchesQuery()`, `readFileAsImage()`, `svgToDataUri()`, `toRemoteImageType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 59`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 117`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `serverFetch()` connect `Community 1` to `Community 0`, `Community 32`, `Community 3`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Why does `getUser()` connect `Community 0` to `Community 1`, `Community 2`, `Community 3`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `getAuthToken()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Are the 54 inferred relationships involving `serverFetch()` (e.g. with `ArtistDashboardPage()` and `EventSettingsPage()`) actually correct?**
  _`serverFetch()` has 54 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `getAuthToken()` (e.g. with `GET()` and `createClient()`) actually correct?**
  _`getAuthToken()` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `getUser()` (e.g. with `DashboardLayout()` and `AdminDashboardPage()`) actually correct?**
  _`getUser()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `EventSettingsPage()`) actually correct?**
  _`createClient()` has 21 INFERRED edges - model-reasoned connections that need verification._