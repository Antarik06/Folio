# Graph Report - Folio  (2026-06-03)

## Corpus Check
- 220 files · ~262,737 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 639 nodes · 627 edges · 25 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.8)
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
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 118|Community 118]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 44 edges
2. `getAuthToken()` - 28 edges
3. `createClient()` - 21 edges
4. `GET()` - 13 edges
5. `getUser()` - 13 edges
6. `Alert()` - 10 edges
7. `handleSubmit()` - 9 edges
8. `getAuthToken()` - 8 edges
9. `getAuthToken()` - 7 edges
10. `getProfile()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `fetchAlbums()`  [INFERRED]
  frontend\app\auth\callback\route.ts → frontend\components\album-editor\sidebar.tsx
- `AdminDashboardPage()` --calls--> `getUser()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\admin\page.tsx → frontend\lib\actions\auth.ts
- `EventSettingsPage()` --calls--> `serverFetch()`  [INFERRED]
  frontend\app\(dashboard)\events\[id]\settings\page.tsx → frontend\lib\api-client.ts
- `CheckoutPage()` --calls--> `serverFetch()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\templates\checkout\[id]\page.tsx → frontend\lib\api-client.ts
- `SimpleTemplateEditorPage()` --calls--> `serverFetch()`  [INFERRED]
  frontend\app\(dashboard)\dashboard\templates\editor\[id]\page.tsx → frontend\lib\api-client.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (25): createAdminClient(), getProfile(), getUser(), signIn(), signInWithGoogle(), signOut(), signUp(), DashboardLayout() (+17 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (29): serverFetch(), approvePhoto(), createAlbumAction(), createFolderAction(), deleteAlbum(), deleteEvent(), deleteFolderAction(), deletePhoto() (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (13): Alert(), authenticateGoogleDrive(), loadGoogleScripts(), handleCreateFolder(), handleDeleteFolder(), handleMovePhoto(), handleUpdateLocation(), handleUpdateTags() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 4 - "Community 4"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 5 - "Community 5"
Cohesion: 0.23
Nodes (11): handleEventClick(), handleStatusChange(), handleUserClick(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders(), getAdminUserEvents(), getAdminUsers() (+3 more)

### Community 6 - "Community 6"
Cohesion: 0.31
Nodes (7): computePriceCents(), formatPrice(), getShippingAddressErrors(), isPageCountValid(), validatePostalCode(), validateQuantity(), validateShippingAddress()

### Community 7 - "Community 7"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 11 - "Community 11"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 13 - "Community 13"
Cohesion: 0.39
Nodes (7): handlePlaceOrder(), loadScript(), createOrder(), getAlbumOrder(), getAuthToken(), getUserOrders(), verifyPayment()

### Community 14 - "Community 14"
Cohesion: 0.32
Nodes (3): handleClose(), handleDoubleClickFile(), handleImport()

### Community 15 - "Community 15"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 16 - "Community 16"
Cohesion: 0.33
Nodes (4): ensureAdminProfile(), getClient(), query(), runMigrations()

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (1): fetchAlbums()

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 22 - "Community 22"
Cohesion: 0.38
Nodes (4): PreviewPage(), inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 28 - "Community 28"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 29 - "Community 29"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 30 - "Community 30"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 34 - "Community 34"
Cohesion: 0.83
Nodes (3): mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 47 - "Community 47"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 60 - "Community 60"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 118 - "Community 118"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 7`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 11`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (7 nodes): `sidebar.tsx`, `fetchAlbums()`, `isVisiblePreset()`, `matchesQuery()`, `readFileAsImage()`, `svgToDataUri()`, `toRemoteImageType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 60`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 118`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `serverFetch()` connect `Community 1` to `Community 0`, `Community 34`, `Community 5`, `Community 13`, `Community 22`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 0` to `Community 1`, `Community 13`, `Community 22`?**
  _High betweenness centrality (0.013) - this node is a cross-community bridge._
- **Why does `getAuthToken()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `serverFetch()` (e.g. with `EventSettingsPage()` and `CheckoutPage()`) actually correct?**
  _`serverFetch()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getAuthToken()` (e.g. with `GET()` and `createClient()`) actually correct?**
  _`getAuthToken()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `EventSettingsPage()`) actually correct?**
  _`createClient()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `GET()` (e.g. with `handleSubmit()` and `handleEventSelect()`) actually correct?**
  _`GET()` has 12 INFERRED edges - model-reasoned connections that need verification._