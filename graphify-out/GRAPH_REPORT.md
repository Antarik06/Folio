# Graph Report - .  (2026-06-03)

## Corpus Check
- Large corpus: 232 files · ~222,975 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder, or use --no-semantic to run AST-only.

## Summary
- 625 nodes · 605 edges · 24 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 115 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Page Frontend|Page Frontend]]
- [[_COMMUNITY_Events Client|Events Client]]
- [[_COMMUNITY_Editor Applyimagepooltospreads|Editor Applyimagepooltospreads]]
- [[_COMMUNITY_Photo Grid|Photo Grid]]
- [[_COMMUNITY_Workspace Frontend|Workspace Frontend]]
- [[_COMMUNITY_Admin Dashboard|Admin Dashboard]]
- [[_COMMUNITY_Pricing Backend|Pricing Backend]]
- [[_COMMUNITY_Photo Editor|Photo Editor]]
- [[_COMMUNITY_Sidebar Frontend|Sidebar Frontend]]
- [[_COMMUNITY_Orders Order|Orders Order]]
- [[_COMMUNITY_Toast Frontend|Toast Frontend]]
- [[_COMMUNITY_Index Backend|Index Backend]]
- [[_COMMUNITY_Sidebar Frontend|Sidebar Frontend]]
- [[_COMMUNITY_Guest List|Guest List]]
- [[_COMMUNITY_Book3D Magazine3D|Book3D Magazine3D]]
- [[_COMMUNITY_Product Type|Product Type]]
- [[_COMMUNITY_Event Settings|Event Settings]]
- [[_COMMUNITY_Flipbook Clamp|Flipbook Clamp]]
- [[_COMMUNITY_Carousel Carouselnext|Carousel Carouselnext]]
- [[_COMMUNITY_Page Frontend|Page Frontend]]
- [[_COMMUNITY_Dashboard Page|Dashboard Page]]
- [[_COMMUNITY_Layers Panel|Layers Panel]]
- [[_COMMUNITY_Mobile Frontend|Mobile Frontend]]
- [[_COMMUNITY_Minor Flow 117|Minor Flow 117]]

## God Nodes (most connected - your core abstractions)
1. `serverFetch()` - 44 edges
2. `getAuthToken()` - 28 edges
3. `createClient()` - 21 edges
4. `GET()` - 13 edges
5. `getUser()` - 12 edges
6. `handleSubmit()` - 9 edges
7. `getAuthToken()` - 8 edges
8. `Alert()` - 7 edges
9. `getAuthToken()` - 7 edges
10. `getProfile()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `fetchAlbums()` --calls--> `GET()`  [INFERRED]
  C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\components\album-editor\sidebar.tsx → C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\app\auth\callback\route.ts
- `AdminDashboardPage()` --calls--> `getUser()`  [INFERRED]
  C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\app\(dashboard)\dashboard\admin\page.tsx → C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\lib\actions\auth.ts
- `EventSettingsPage()` --calls--> `serverFetch()`  [INFERRED]
  C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\app\(dashboard)\events\[id]\settings\page.tsx → C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\lib\api-client.ts
- `CheckoutPage()` --calls--> `serverFetch()`  [INFERRED]
  C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\app\(dashboard)\dashboard\templates\checkout\[id]\page.tsx → C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\lib\api-client.ts
- `SimpleTemplateEditorPage()` --calls--> `serverFetch()`  [INFERRED]
  C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\app\(dashboard)\dashboard\templates\editor\[id]\page.tsx → C:\Users\SUBHAM NABIK\Desktop\Folio2\Folio\frontend\lib\api-client.ts

## Communities

### Community 0 - "Page Frontend"
Cohesion: 0.06
Nodes (26): createAdminClient(), getProfile(), getUser(), signIn(), signInWithGoogle(), signOut(), signUp(), DashboardLayout() (+18 more)

### Community 1 - "Events Client"
Cohesion: 0.16
Nodes (29): serverFetch(), approvePhoto(), createAlbumAction(), createFolderAction(), deleteAlbum(), deleteEvent(), deleteFolderAction(), deletePhoto() (+21 more)

### Community 2 - "Editor Applyimagepooltospreads"
Cohesion: 0.13
Nodes (12): colorDistance(), getDraftKey(), getSpreadSide(), inferImageLayerName(), loadImageForProcessing(), normalizeElement(), parseHexColor(), recolorLikelyMonochromeImage() (+4 more)

### Community 3 - "Photo Grid"
Cohesion: 0.13
Nodes (7): Alert(), handleCreateFolder(), handleDeleteFolder(), handleMovePhoto(), handleUpdateLocation(), handleUpdateTags(), handleSave()

### Community 4 - "Workspace Frontend"
Cohesion: 0.12
Nodes (3): onDragEnd(), onDragMove(), snapPosition()

### Community 5 - "Admin Dashboard"
Cohesion: 0.23
Nodes (11): handleEventClick(), handleStatusChange(), handleUserClick(), getAdminEventAlbums(), getAdminEventPhotos(), getAdminOrders(), getAdminUserEvents(), getAdminUsers() (+3 more)

### Community 6 - "Pricing Backend"
Cohesion: 0.31
Nodes (7): computePriceCents(), formatPrice(), getShippingAddressErrors(), isPageCountValid(), validatePostalCode(), validateQuantity(), validateShippingAddress()

### Community 7 - "Photo Editor"
Cohesion: 0.2
Nodes (2): handleReset(), resetCrop()

### Community 11 - "Sidebar Frontend"
Cohesion: 0.22
Nodes (2): SidebarMenuButton(), useSidebar()

### Community 13 - "Orders Order"
Cohesion: 0.39
Nodes (7): handlePlaceOrder(), loadScript(), createOrder(), getAlbumOrder(), getAuthToken(), getUserOrders(), verifyPayment()

### Community 14 - "Toast Frontend"
Cohesion: 0.57
Nodes (6): addToRemoveQueue(), dispatch(), genId(), reducer(), toast(), useToast()

### Community 15 - "Index Backend"
Cohesion: 0.33
Nodes (4): ensureAdminProfile(), getClient(), query(), runMigrations()

### Community 16 - "Sidebar Frontend"
Cohesion: 0.29
Nodes (1): fetchAlbums()

### Community 17 - "Guest List"
Cohesion: 0.29
Nodes (1): handleGenerateColCode()

### Community 18 - "Book3D Magazine3D"
Cohesion: 0.33
Nodes (3): generateTextures(), renderToCanvas(), gen()

### Community 21 - "Product Type"
Cohesion: 0.38
Nodes (4): PreviewPage(), inferAlbumProductType(), inferTemplateProductType(), isProductType()

### Community 27 - "Event Settings"
Cohesion: 0.4
Nodes (1): handleDeleteEvent()

### Community 28 - "Flipbook Clamp"
Cohesion: 0.5
Nodes (2): clamp(), initialize()

### Community 29 - "Carousel Carouselnext"
Cohesion: 0.5
Nodes (2): CarouselNext(), useCarousel()

### Community 33 - "Page Frontend"
Cohesion: 0.83
Nodes (3): mapSpreadsToPages(), normalizeSpreads(), SharedAlbumPage()

### Community 46 - "Dashboard Page"
Cohesion: 0.67
Nodes (1): PolaroidPage()

### Community 47 - "Layers Panel"
Cohesion: 1.0
Nodes (2): getDefaultName(), inferImageLayerName()

### Community 59 - "Mobile Frontend"
Cohesion: 0.67
Nodes (1): useIsMobile()

### Community 117 - "Minor Flow 117"
Cohesion: 1.0
Nodes (1): PageFlip

## Knowledge Gaps
- **1 isolated node(s):** `PageFlip`
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Photo Editor`** (11 nodes): `photo-editor.tsx`, `applyCropAspect()`, `buildCssFilter()`, `clamp()`, `handleReset()`, `handleSave()`, `resetCrop()`, `snapRotate()`, `startResize()`, `stopResize()`, `updateSize()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Frontend`** (10 nodes): `sidebar.tsx`, `cn()`, `handleKeyDown()`, `SidebarFooter()`, `SidebarHeader()`, `SidebarMenu()`, `SidebarMenuButton()`, `SidebarMenuItem()`, `SidebarSeparator()`, `useSidebar()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Frontend`** (7 nodes): `sidebar.tsx`, `fetchAlbums()`, `isVisiblePreset()`, `matchesQuery()`, `readFileAsImage()`, `svgToDataUri()`, `toRemoteImageType()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Guest List`** (7 nodes): `guest-list.tsx`, `copyCode()`, `copyColCode()`, `copyColLink()`, `copyLink()`, `handleGenerateColCode()`, `handleRemove()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Event Settings`** (5 nodes): `coerceSettings()`, `getPhotoUrl()`, `handleDeleteEvent()`, `saveSettings()`, `event-settings-panel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Flipbook Clamp`** (5 nodes): `clamp()`, `handleKeyDown()`, `initialize()`, `usePageScale()`, `FlipBook.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Carousel Carouselnext`** (5 nodes): `Carousel()`, `CarouselNext()`, `cn()`, `useCarousel()`, `carousel.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dashboard Page`** (3 nodes): `page.tsx`, `page.tsx`, `PolaroidPage()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Layers Panel`** (3 nodes): `layers-panel.tsx`, `getDefaultName()`, `inferImageLayerName()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile Frontend`** (3 nodes): `use-mobile.tsx`, `use-mobile.ts`, `useIsMobile()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Minor Flow 117`** (2 nodes): `page-flip.d.ts`, `PageFlip`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `serverFetch()` connect `Events Client` to `Page Frontend`, `Page Frontend`, `Admin Dashboard`, `Orders Order`, `Product Type`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `getAuthToken()` connect `Events Client` to `Page Frontend`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Page Frontend` to `Events Client`, `Orders Order`, `Product Type`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 43 inferred relationships involving `serverFetch()` (e.g. with `EventSettingsPage()` and `CheckoutPage()`) actually correct?**
  _`serverFetch()` has 43 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getAuthToken()` (e.g. with `GET()` and `createClient()`) actually correct?**
  _`getAuthToken()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `createClient()` (e.g. with `handleSubmit()` and `EventSettingsPage()`) actually correct?**
  _`createClient()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **Are the 12 inferred relationships involving `GET()` (e.g. with `handleSubmit()` and `handleEventSelect()`) actually correct?**
  _`GET()` has 12 INFERRED edges - model-reasoned connections that need verification._