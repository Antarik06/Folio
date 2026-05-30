'use client'

import { useState } from 'react'
import { getAdminUserEvents, getAdminEventPhotos, getAdminEventAlbums, updateAdminOrderStatus } from '@/lib/actions/admin'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  event_count: number
  album_count: number
  order_count: number
}

interface OrderItem {
  id: string
  user_id: string
  album_id: string
  product_type: string
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  payment_status: string
  shipping_address: any
  shipping_status: string
  tracking_status: string
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  created_at: string
  album_title: string | null
  user_email: string | null
  user_full_name: string | null
}

interface AdminDashboardClientProps {
  initialUsers: UserProfile[]
  initialOrders: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: 'order placed', label: 'Order Placed' },
  { value: 'reviewed by humans', label: 'Reviewed by Humans' },
  { value: 'finalize design', label: 'Finalize Design' },
  { value: 'printed', label: 'Printed' },
  { value: 'out for delivery', label: 'Out for Delivery' },
  { value: 'order arrived', label: 'Order Arrived' }
]

export function AdminDashboardClient({ initialUsers, initialOrders }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'orders'>('users')
  const [users] = useState<UserProfile[]>(initialUsers)
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders)

  // UI Interactive States
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userEvents, setUserEvents] = useState<Record<string, any[]>>({})
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null)

  // Event details selection
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventTitle, setSelectedEventTitle] = useState<string | null>(null)
  const [eventPhotos, setEventPhotos] = useState<Record<string, any[]>>({})
  const [eventAlbums, setEventAlbums] = useState<Record<string, any[]>>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)

  // Modifying status state
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleUserClick = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }

    setExpandedUserId(userId)
    setSelectedEventId(null) // reset child selection

    if (!userEvents[userId]) {
      setLoadingEvents(userId)
      try {
        const events = await getAdminUserEvents(userId)
        setUserEvents(prev => ({ ...prev, [userId]: events }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingEvents(null)
      }
    }
  }

  const handleEventClick = async (eventId: string, eventTitle: string) => {
    if (selectedEventId === eventId) {
      setSelectedEventId(null)
      setSelectedEventTitle(null)
      return
    }

    setSelectedEventId(eventId)
    setSelectedEventTitle(eventTitle)

    if (!eventPhotos[eventId] || !eventAlbums[eventId]) {
      setLoadingDetails(eventId)
      try {
        const [photos, albums] = await Promise.all([
          getAdminEventPhotos(eventId),
          getAdminEventAlbums(eventId)
        ])
        setEventPhotos(prev => ({ ...prev, [eventId]: photos }))
        setEventAlbums(prev => ({ ...prev, [eventId]: albums }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDetails(null)
      }
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    setNotification(null)
    try {
      const res = await updateAdminOrderStatus(orderId, newStatus)
      if (res.success && res.order) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, tracking_status: res.order.tracking_status } : o))
        )
        setNotification({ message: 'Order status updated successfully!', type: 'success' })
      } else {
        setNotification({ message: res.error || 'Failed to update order status.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setUpdatingOrderId(null)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  // Helper to color code tracking status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'order placed':
        return 'bg-muted/50 text-muted-foreground border-muted'
      case 'reviewed by humans':
        return 'bg-blue-950/40 text-blue-400 border-blue-900/50'
      case 'finalize design':
        return 'bg-purple-950/40 text-purple-400 border-purple-900/50'
      case 'printed':
        return 'bg-cyan-950/40 text-cyan-400 border-cyan-900/50'
      case 'out for delivery':
        return 'bg-amber-950/40 text-amber-400 border-amber-900/50'
      case 'order arrived':
        return 'bg-green-950/40 text-green-400 border-green-900/50'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 px-6 py-3 border text-sm font-sans shadow-lg transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-green-950/95 border-green-800 text-green-200'
              : 'bg-red-950/95 border-red-800 text-red-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => {
            setActiveTab('users')
            setExpandedUserId(null)
            setSelectedEventId(null)
          }}
          className={`pb-4 px-2 text-sm font-sans uppercase tracking-[0.2em] transition-colors relative ${
            activeTab === 'users' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Users Directory
          {activeTab === 'users' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in duration-300" />}
        </button>
        <button
          onClick={() => {
            setActiveTab('orders')
            setExpandedUserId(null)
            setSelectedEventId(null)
          }}
          className={`pb-4 px-2 text-sm font-sans uppercase tracking-[0.2em] transition-colors relative ${
            activeTab === 'orders' ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Orders Manager
          {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in duration-300" />}
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-card border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider font-mono">
                    <th className="py-4 px-6">User / Email</th>
                    <th className="py-4 px-6">Registered</th>
                    <th className="py-4 px-6 text-center">Events</th>
                    <th className="py-4 px-6 text-center">Albums</th>
                    <th className="py-4 px-6 text-center">Orders</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-sm">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    users.map(u => {
                      const isExpanded = expandedUserId === u.id
                      return (
                        <tr
                          key={u.id}
                          className={`hover:bg-muted/10 transition-colors ${
                            isExpanded ? 'bg-muted/10' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="font-medium text-foreground">{u.full_name || 'Guest User'}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </td>
                          <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                            {new Date(u.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-6 text-center font-mono">{u.event_count}</td>
                          <td className="py-4 px-6 text-center font-mono">{u.album_count}</td>
                          <td className="py-4 px-6 text-center font-mono">{u.order_count}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleUserClick(u.id)}
                              className="text-xs font-sans uppercase tracking-wider text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                            >
                              {isExpanded ? 'Close Activity' : 'View Activity'}
                              <svg
                                className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User expanded events list */}
          {expandedUserId && (
            <div className="bg-card border border-border p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="font-serif text-xl text-foreground">
                  Events Created by {users.find(u => u.id === expandedUserId)?.full_name || 'User'}
                </h3>
              </div>

              {loadingEvents === expandedUserId ? (
                <div className="py-8 flex justify-center">
                  <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !userEvents[expandedUserId] || userEvents[expandedUserId].length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  This user has not created any events yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {userEvents[expandedUserId].map(event => {
                    const isSelected = selectedEventId === event.id
                    return (
                      <div
                        key={event.id}
                        className={`border p-5 transition-all flex flex-col justify-between ${
                          isSelected ? 'border-primary bg-muted/10' : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start gap-4 mb-2">
                            <h4 className="font-medium text-foreground text-base truncate">{event.title}</h4>
                            <span className="text-xs font-mono bg-muted px-2 py-0.5 border border-border rounded text-muted-foreground">
                              Code: {event.invite_code || 'N/A'}
                            </span>
                          </div>
                          {event.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                          )}
                          <div className="grid grid-cols-3 gap-2 text-xs font-mono text-muted-foreground bg-muted/20 p-2.5 mb-4">
                            <div>
                              <div className="text-[10px] uppercase text-muted-foreground/60 mb-0.5">Date</div>
                              <div>
                                {event.event_date
                                  ? new Date(event.event_date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric'
                                    })
                                  : 'N/A'}
                              </div>
                            </div>
                            <div className="text-center border-x border-border">
                              <div className="text-[10px] uppercase text-muted-foreground/60 mb-0.5">Photos</div>
                              <div className="font-semibold text-foreground">{event.photo_count}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase text-muted-foreground/60 mb-0.5">Albums</div>
                              <div className="font-semibold text-foreground">{event.album_count}</div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleEventClick(event.id, event.title)}
                          className={`w-full py-2.5 text-xs font-sans uppercase tracking-wider border text-center transition-colors ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-transparent text-foreground border-border hover:border-foreground/50'
                          }`}
                        >
                          {isSelected ? 'Collapse Event Assets' : 'Inspect Event Assets'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Event details drawer / inspect view */}
              {selectedEventId && (
                <div className="mt-8 border-t border-border pt-6 space-y-6 animate-in slide-in-from-bottom duration-300">
                  <h4 className="font-serif text-lg text-foreground">
                    Inspecting event assets: <span className="text-primary italic">&quot;{selectedEventTitle}&quot;</span>
                  </h4>

                  {loadingDetails === selectedEventId ? (
                    <div className="py-8 flex justify-center">
                      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Left: Photos list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                            Uploaded Photos ({eventPhotos[selectedEventId]?.length || 0})
                          </h5>
                        </div>
                        {!eventPhotos[selectedEventId] || eventPhotos[selectedEventId].length === 0 ? (
                          <div className="p-8 border border-dashed border-border text-center text-sm text-muted-foreground">
                            No photos uploaded in this event.
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-1">
                            {eventPhotos[selectedEventId].map(photo => (
                              <div
                                key={photo.id}
                                className="aspect-square bg-muted relative group overflow-hidden border border-border/50"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photo.blob_url}
                                  alt="Event asset"
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute bottom-0 inset-x-0 bg-black/75 p-1 text-[9px] font-mono text-muted-foreground flex justify-between">
                                  <span>{photo.uploaded_by_role}</span>
                                  <span>{photo.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Right: Albums list */}
                      <div className="space-y-4">
                        <h5 className="font-sans text-xs uppercase tracking-wider text-muted-foreground">
                          Created Albums ({eventAlbums[selectedEventId]?.length || 0})
                        </h5>
                        {!eventAlbums[selectedEventId] || eventAlbums[selectedEventId].length === 0 ? (
                          <div className="p-8 border border-dashed border-border text-center text-sm text-muted-foreground">
                            No albums created for this event.
                          </div>
                        ) : (
                          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                            {eventAlbums[selectedEventId].map(album => (
                              <div
                                key={album.id}
                                className="p-4 bg-muted/40 border border-border flex justify-between items-center"
                              >
                                <div>
                                  <h6 className="font-medium text-foreground text-sm">{album.title}</h6>
                                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                    Status: <span className="uppercase">{album.status || 'draft'}</span>
                                  </p>
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  Pages: {Array.isArray(album.layout_data?.spreads) ? album.layout_data.spreads.length : '0'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div className="bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-muted-foreground text-xs uppercase tracking-wider font-mono">
                  <th className="py-4 px-6">Order ID / Date</th>
                  <th className="py-4 px-6">Book / Client</th>
                  <th className="py-4 px-6 text-center">Qty</th>
                  <th className="py-4 px-6 text-right">Total Price</th>
                  <th className="py-4 px-6 text-center">Payment</th>
                  <th className="py-4 px-6">Tracking Status Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-sm">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No print orders received yet.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const trackingStatus = order.tracking_status || 'order placed'
                    const isUpdating = updatingOrderId === order.id

                    return (
                      <tr key={order.id} className="hover:bg-muted/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="font-mono text-xs text-foreground truncate max-w-[120px]" title={order.id}>
                            {order.id.substring(0, 8)}...
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-foreground">{order.album_title || 'Untitled Album'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {order.user_full_name} ({order.user_email})
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground/80 mt-1">
                            Type: <span className="uppercase">{order.product_type}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center font-mono">{order.quantity}</td>
                        <td className="py-4 px-6 text-right font-mono font-medium text-foreground">
                          Rs. {(order.total_price / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider border rounded-full ${
                              order.payment_status === 'paid'
                                ? 'bg-green-950/40 text-green-400 border-green-900/50'
                                : 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                            }`}
                          >
                            {order.payment_status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <select
                              value={trackingStatus}
                              disabled={isUpdating}
                              onChange={e => handleStatusChange(order.id, e.target.value)}
                              className={`px-2.5 py-1.5 text-xs font-medium border focus:outline-none focus:border-primary bg-card ${getStatusBadgeClass(
                                trackingStatus
                              )} ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value} className="bg-background text-foreground">
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                            {isUpdating && (
                              <div className="w-3.5 h-3.5 border border-primary/20 border-t-primary rounded-full animate-spin shrink-0" />
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
