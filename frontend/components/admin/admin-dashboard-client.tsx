'use client'

import React, { useState, useEffect } from 'react'
import {
  Users, Package, DollarSign, Percent, TrendingUp, Ban, UserCheck, 
  Settings, Plus, Trash2, ShieldAlert, Calendar, BarChart3, ChevronDown, CheckCircle, 
  AlertCircle, ArrowLeft, Search, RefreshCw, Layers, Phone, HelpCircle, 
  Database, ShieldCheck, Tag, Info, ArrowUpRight
} from 'lucide-react'
import {
  getAdminUserEvents, getAdminEventPhotos, getAdminEventAlbums, updateAdminOrderStatus,
  getAdminSettings, updateSystemSettings, getPromoCodes, createPromoCode, deletePromoCode, updateUserStatus,
  getAdminArtists, assignArtistToOrder, getAdminPremiumProjects, assignArtistToPremiumProject
} from '@/lib/actions/admin'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { formatPrice } from '@/lib/pricing'
import { PrintJobProgress } from '@/components/album-order/print-job-progress'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  is_banned: boolean
  event_count: number
  album_count: number
  order_count: number
}

interface OrderItem {
  id: string
  user_id: string
  album_id: string | null
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
  artist_id?: string | null
}

interface PremiumProject {
  id: string
  user_id: string
  status: string
  brief_json: any
  package_id: string
  advance_payment_amount: number
  balance_amount: number
  photo_uploads: any
  proofs: any
  messages: any
  editor_id: string | null
  user_name: string
  user_email: string
  package_name: string | null
  created_at: string
  updated_at: string
  approved_at: string | null
  advance_paid_at: string | null
  balance_paid_at: string | null
}

interface AdminDashboardClientProps {
  initialUsers: UserProfile[]
  initialOrders: OrderItem[]
}

const STATUS_OPTIONS = [
  { value: 'order placed', label: 'Order Placed', color: 'text-zinc-400 bg-zinc-950/60 border-zinc-800' },
  { value: 'reviewed by humans', label: 'Approved by Designer', color: 'text-blue-400 bg-blue-950/60 border-blue-900/50' },
  { value: 'finalize design', label: 'Finalize Design', color: 'text-purple-400 bg-purple-950/60 border-purple-900/50' },
  { value: 'printed', label: 'Printed', color: 'text-cyan-400 bg-cyan-950/60 border-cyan-900/50' },
  { value: 'out for delivery', label: 'Out for Delivery', color: 'text-amber-400 bg-amber-950/60 border-amber-900/50' },
  { value: 'order arrived', label: 'Order Arrived', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50' }
]

export function AdminDashboardClient({ initialUsers, initialOrders }: AdminDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'orders' | 'settings' | 'coupons' | 'concierge'>('overview')
  const [users, setUsers] = useState<UserProfile[]>(initialUsers)
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders)

  // Artists & Premium Projects
  const [artists, setArtists] = useState<any[]>([])
  const [premiumProjects, setPremiumProjects] = useState<PremiumProject[]>([])
  const [loadingArtists, setLoadingArtists] = useState(false)
  const [loadingPremium, setLoadingPremium] = useState(false)
  const [updatingArtistOrderId, setUpdatingArtistOrderId] = useState<string | null>(null)
  const [updatingArtistProjectId, setUpdatingArtistProjectId] = useState<string | null>(null)

  // Search & filter states
  const [userSearch, setUserSearch] = useState('')
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all')

  // Settings states
  const [settings, setSettings] = useState<any>({
    pricing: { softcover: 89900, hardcover: 149900, polaroid: 19900 },
    page_limits: { softcover: 80, hardcover: 120 },
    min_pages: 24,
    shipping_and_tax: { tax_rate: 18, shipping_fee: 15000, free_shipping_threshold: 150000 },
    min_max_copies: { min: 1, max: 10 }
  })
  const [loadingSettings, setLoadingSettings] = useState(false)

  // Coupons states
  const [coupons, setCoupons] = useState<any[]>([])
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '',
    expires_at: ''
  })
  const [loadingCoupons, setLoadingCoupons] = useState(false)

  // Users Directory Interactions
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userEvents, setUserEvents] = useState<Record<string, any[]>>({})
  const [loadingEvents, setLoadingEvents] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [selectedEventTitle, setSelectedEventTitle] = useState<string | null>(null)
  const [eventPhotos, setEventPhotos] = useState<Record<string, any[]>>({})
  const [eventAlbums, setEventAlbums] = useState<Record<string, any[]>>({})
  const [loadingDetails, setLoadingDetails] = useState<string | null>(null)

  // Updating statuses
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Custom status dropdown state
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null)

  // SSR mounted check for Recharts
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadSystemConfig()
    loadCouponsList()
    loadArtists()
    loadPremiumProjects()
  }, [])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClose = () => setOpenStatusDropdownId(null)
    window.addEventListener('click', handleClose)
    return () => window.removeEventListener('click', handleClose)
  }, [])

  // ── API Fetchers ────────────────────────────────────────────────────────────

  const loadArtists = async () => {
    setLoadingArtists(true)
    try {
      const list = await getAdminArtists()
      setArtists(list || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingArtists(false)
    }
  }

  const loadPremiumProjects = async () => {
    setLoadingPremium(true)
    try {
      const list = await getAdminPremiumProjects()
      setPremiumProjects(list || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingPremium(false)
    }
  }

  const handleArtistChangeForOrder = async (orderId: string, artistId: string | null) => {
    setUpdatingArtistOrderId(orderId)
    setNotification(null)
    try {
      const res = await assignArtistToOrder(orderId, artistId)
      if (res.success && res.order) {
        setOrders((prev: OrderItem[]) =>
          prev.map(o => (o.id === orderId ? { ...o, artist_id: res.order.artist_id } : o))
        )
        setNotification({ message: 'Artist reassigned successfully!', type: 'success' })
      } else {
        setNotification({ message: res.error || 'Failed to reassign artist.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setUpdatingArtistOrderId(null)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleArtistChangeForPremiumProject = async (projectId: string, artistId: string | null) => {
    setUpdatingArtistProjectId(projectId)
    setNotification(null)
    try {
      const res = await assignArtistToPremiumProject(projectId, artistId)
      if (res.success && res.project) {
        setPremiumProjects((prev: PremiumProject[]) =>
          prev.map(p => (p.id === projectId ? { ...p, editor_id: res.project.editor_id, status: res.project.status } : p))
        )
        setNotification({ message: 'Artist reassigned successfully!', type: 'success' })
      } else {
        setNotification({ message: res.error || 'Failed to reassign artist.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setUpdatingArtistProjectId(null)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const loadSystemConfig = async () => {
    setLoadingSettings(true)
    try {
      const config = await getAdminSettings()
      if (config && Object.keys(config).length > 0) {
        setSettings((prev: any) => ({ ...prev, ...config }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSettings(false)
    }
  }

  const loadCouponsList = async () => {
    setLoadingCoupons(true)
    try {
      const list = await getPromoCodes()
      setCoupons(list || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingCoupons(false)
    }
  }

  // ── Stat calculations ───────────────────────────────────────────────────────

  const paidOrders = orders.filter(o => o.payment_status === 'paid')
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total_price, 0)
  const totalOrdersCount = orders.length
  const totalUsersCount = users.length
  const bannedUsersCount = users.filter(u => u.is_banned).length

  // Conversion rate (Percentage of users who have paid orders)
  const userOrderSet = new Set(paidOrders.map(o => o.user_id))
  const conversionRate = totalUsersCount > 0 ? ((userOrderSet.size / totalUsersCount) * 100).toFixed(1) : '0'
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0

  // Chart Data preparation
  const chartData = Object.entries(
    orders.reduce((acc, o) => {
      const dateStr = new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, revenue: 0, orders: 0 }
      acc[dateStr].orders += 1
      if (o.payment_status === 'paid') {
        acc[dateStr].revenue += Math.round(o.total_price / 100)
      }
      return acc
    }, {} as Record<string, { date: string; revenue: number; orders: number }>)
  ).map(([_, value]) => value).reverse().slice(-7)

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleToggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    setUpdatingUserId(userId)
    try {
      const res = await updateUserStatus(userId, !currentBanStatus)
      if (res.success) {
        setUsers((prev: UserProfile[]) => prev.map(u => u.id === userId ? { ...u, is_banned: res.user.is_banned } : u))
        setNotification({
          message: `User is now ${res.user.is_banned ? 'suspended' : 'active'}.`,
          type: 'success'
        })
      } else {
        setNotification({ message: res.error || 'Failed to update user status.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setUpdatingUserId(null)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId)
    setNotification(null)
    try {
      const res = await updateAdminOrderStatus(orderId, newStatus)
      if (res.success && res.order) {
        setOrders((prev: OrderItem[]) =>
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

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSettings(true)
    try {
      const pricingVal = {
        softcover: Math.round(parseFloat(settings.pricing.softcover_rs) * 100) || settings.pricing.softcover,
        hardcover: Math.round(parseFloat(settings.pricing.hardcover_rs) * 100) || settings.pricing.hardcover,
        polaroid: Math.round(parseFloat(settings.pricing.polaroid_rs) * 100) || settings.pricing.polaroid,
      }
      const shippingVal = {
        tax_rate: parseInt(settings.shipping_and_tax.tax_rate) || 18,
        shipping_fee: Math.round(parseFloat(settings.shipping_and_tax.shipping_fee_rs) * 100) || 15000,
        free_shipping_threshold: Math.round(parseFloat(settings.shipping_and_tax.free_shipping_threshold_rs) * 100) || 150000
      }

      const payload = {
        pricing: pricingVal,
        page_limits: {
          softcover: parseInt(settings.page_limits.softcover) || 80,
          hardcover: parseInt(settings.page_limits.hardcover) || 120
        },
        min_pages: parseInt(settings.min_pages) || 24,
        shipping_and_tax: shippingVal,
        min_max_copies: {
          min: parseInt(settings.min_max_copies.min) || 1,
          max: parseInt(settings.min_max_copies.max) || 10
        }
      }

      const res = await updateSystemSettings(payload)
      if (res.success) {
        setNotification({ message: 'System configurations saved successfully!', type: 'success' })
        loadSystemConfig()
      } else {
        setNotification({ message: res.error || 'Failed to update configurations.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setLoadingSettings(false)
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code.trim()) return

    try {
      const discountValue = newCoupon.discount_type === 'percentage'
        ? parseInt(newCoupon.discount_value)
        : Math.round(parseFloat(newCoupon.discount_value) * 100)

      const minOrderVal = newCoupon.min_order_value
        ? Math.round(parseFloat(newCoupon.min_order_value) * 100)
        : 0

      const res = await createPromoCode({
        code: newCoupon.code,
        discount_type: newCoupon.discount_type,
        discount_value: discountValue,
        min_order_value: minOrderVal,
        expires_at: newCoupon.expires_at || null
      })

      if (res.success) {
        setNotification({ message: 'Promo code created successfully!', type: 'success' })
        setNewCoupon({
          code: '',
          discount_type: 'percentage',
          discount_value: '',
          min_order_value: '',
          expires_at: ''
        })
        loadCouponsList()
      } else {
        setNotification({ message: res.error || 'Failed to create coupon.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDeletePromo = async (code: string) => {
    if (!confirm(`Are you sure you want to delete promo code: ${code}?`)) return
    try {
      const res = await deletePromoCode(code)
      if (res.success) {
        setNotification({ message: 'Promo code deleted successfully.', type: 'success' })
        loadCouponsList()
      } else {
        setNotification({ message: res.error || 'Failed to delete.', type: 'error' })
      }
    } catch (err: any) {
      setNotification({ message: err.message || 'Error occurred.', type: 'error' })
    } finally {
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleUserClick = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
      return
    }

    setExpandedUserId(userId)
    setSelectedEventId(null)

    if (!userEvents[userId]) {
      setLoadingEvents(userId)
      try {
        const events = await getAdminUserEvents(userId)
        setUserEvents((prev: any) => ({ ...prev, [userId]: events }))
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
        setEventPhotos((prev: any) => ({ ...prev, [eventId]: photos }))
        setEventAlbums((prev: any) => ({ ...prev, [eventId]: albums }))
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDetails(null)
      }
    }
  }

  // ── Filters implementations ────────────────────────────────────────────────

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.user_full_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (o.album_title && o.album_title.toLowerCase().includes(orderSearch.toLowerCase()))

    const matchesStatus = 
      orderFilterStatus === 'all' || 
      o.tracking_status === orderFilterStatus ||
      (orderFilterStatus === 'paid' && o.payment_status === 'paid') ||
      (orderFilterStatus === 'pending' && o.payment_status === 'pending')

    return matchesSearch && matchesStatus
  })

  // Recharts Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#211D19] border border-border/30 px-3 py-2.5 rounded-lg shadow-xl text-xs font-mono text-[#F5F0E8] space-y-1">
          <p className="text-muted-foreground uppercase text-[9px] tracking-wider">{label}</p>
          <p className="text-primary font-bold">Revenue: {formatPrice(payload[0].value * 100)}</p>
          <p className="text-secondary">Orders: {payload[0].payload.orders}</p>
        </div>
      )
    }
    return null
  }

  // Get user avatar background color based on name letter
  const getAvatarBg = (name: string) => {
    const char = name.toUpperCase().charAt(0) || 'A'
    const code = char.charCodeAt(0)
    if (code % 3 === 0) return 'bg-[#B85C38]/20 text-[#B85C38] border-[#B85C38]/30'
    if (code % 3 === 1) return 'bg-[#3A7D6E]/20 text-[#3A7D6E] border-[#3A7D6E]/30'
    return 'bg-[#7A6F64]/20 text-[#F5F0E8] border-[#7A6F64]/30'
  }

  return (
    <div className="min-h-screen bg-[#1C1814] text-[#F5F0E8] flex flex-col antialiased film-grain">
      
      {/* ── CUSTOM PREMIUM DEDICATED HEADER ── */}
      <header className="sticky top-0 z-50 w-full bg-[#1C1814]/80 backdrop-blur-md border-b border-border/10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-serif text-lg tracking-widest text-[#F5F0E8] font-bold">
              FOLIO <span className="text-primary">/</span> ADMIN
            </span>
            <div className="h-4 w-px bg-border/20" />
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase hidden sm:inline">
                Telemetry: SECURE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-secondary" />
                <span>DB: Connected</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-border/30" />
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>Access: Root</span>
              </div>
            </div>

            <Link
              href="/photos"
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-border/20 hover:border-primary/50 text-[10px] uppercase font-mono tracking-widest text-muted-foreground hover:text-primary transition-all duration-300 rounded"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 border text-xs font-mono shadow-2xl transition-all duration-300 rounded flex items-center gap-2 animate-in slide-in-from-top-4 ${
            notification.type === 'success'
              ? 'bg-[#1C3E24] border-[#2E6B3E] text-[#BCE6C9]'
              : 'bg-[#5C1A1A] border-[#992E2E] text-[#F3C4C4]'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
          {notification.message}
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTAINER ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        
        {/* Page Title & Context */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/10 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 text-[9px] uppercase tracking-widest text-primary font-mono">
              <ShieldAlert className="w-3 h-3" />
              <span>Core Control Panel</span>
            </div>
            <h1 className="font-serif text-4xl text-[#F5F0E8] font-bold tracking-tight">Admin Panel</h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Unified control center to manage product configurations, live catalog pricing, active discount keys, system limit bounds, and registered client transactions.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 bg-[#252019] border border-border/10 rounded">
              <span className="text-[9px] uppercase text-muted-foreground font-mono tracking-wider block">Live Platform Users</span>
              <span className="text-xl font-serif font-bold text-[#F5F0E8]">{users.length}</span>
            </div>
            <div className="px-4 py-2 bg-[#252019] border border-border/10 rounded">
              <span className="text-[9px] uppercase text-muted-foreground font-mono tracking-wider block">Physical Print Orders</span>
              <span className="text-xl font-serif font-bold text-[#F5F0E8]">{orders.length}</span>
            </div>
          </div>
        </div>

        {/* Custom Tab Switcher */}
        <div className="flex border-b border-border/10 overflow-x-auto scrollbar-hide gap-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'users', label: 'Users Directory', icon: Users },
            { id: 'orders', label: 'Orders Manager', icon: Package },
            { id: 'concierge', label: 'Concierge Projects', icon: Layers },
            { id: 'coupons', label: 'Coupons Manager', icon: Percent },
            { id: 'settings', label: 'System Configuration', icon: Settings },
          ].map(tab => {
            const TabIcon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any)
                  setExpandedUserId(null)
                  setSelectedEventId(null)
                }}
                className={`flex items-center gap-2 pb-4 px-5 text-[10px] font-mono uppercase tracking-widest transition-all relative shrink-0 ${
                  isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-[#F5F0E8]'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary animate-in fade-in duration-300" />
                )}
              </button>
            )
          })}

          {/* Card templates get their own screen: editing one is a design task
              with a live proof, not a table of rows. */}
          <Link
            href="/admin/cards"
            className="flex items-center gap-2 pb-4 px-5 text-[10px] font-mono uppercase tracking-widest transition-all relative shrink-0 text-muted-foreground hover:text-[#F5F0E8]"
          >
            <Layers className="w-3.5 h-3.5" />
            Card Templates
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* ── TAB 1: OVERVIEW ANALYTICS ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* Elegant Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-[#252019] border border-border/15 p-5 rounded-lg hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all">
                  <DollarSign className="w-12 h-12 text-[#F5F0E8]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Total Sales Revenue</span>
                  <h3 className="font-serif text-2xl font-bold text-[#F5F0E8]">{formatPrice(totalRevenue)}</h3>
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-emerald-400 font-mono">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Live Gross Receipts</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#252019] border border-border/15 p-5 rounded-lg hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all">
                  <Package className="w-12 h-12 text-[#F5F0E8]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Total Print Orders</span>
                  <h3 className="font-serif text-2xl font-bold text-[#F5F0E8]">{totalOrdersCount}</h3>
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-muted-foreground font-mono">
                    <span>Paid & pending queues</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#252019] border border-border/15 p-5 rounded-lg hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all">
                  <Users className="w-12 h-12 text-[#F5F0E8]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Registered Clients</span>
                  <h3 className="font-serif text-2xl font-bold text-[#F5F0E8]">{totalUsersCount}</h3>
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-[#3A7D6E] font-mono">
                    <span>Active event creators</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#252019] border border-border/15 p-5 rounded-lg hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all">
                  <TrendingUp className="w-12 h-12 text-[#F5F0E8]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Client Conversion</span>
                  <h3 className="font-serif text-2xl font-bold text-[#F5F0E8]">{conversionRate}%</h3>
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-primary font-mono">
                    <span>Orders vs registrations</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#252019] border border-border/15 p-5 rounded-lg hover:border-primary/30 transition-all duration-300 relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-all">
                  <Ban className="w-12 h-12 text-[#F5F0E8]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">Banned Accounts</span>
                  <h3 className="font-serif text-2xl font-bold text-rose-400">{bannedUsersCount}</h3>
                  <div className="flex items-center gap-1 mt-2 text-[9px] text-muted-foreground font-mono">
                    <span>Policy violations</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Visual Analytics / Charts & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Sales Chart */}
              <div className="bg-[#252019] border border-border/10 p-6 rounded-lg lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg text-[#F5F0E8] font-bold">Sales & Activity Trend (Last 7 Days)</h3>
                  <span className="text-[9px] font-mono uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 text-primary">Live Trend</span>
                </div>
                <div className="w-full h-80 font-mono">
                  {mounted && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary, #B85C38)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary, #B85C38)" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a251f" vertical={false} />
                        <XAxis dataKey="date" stroke="#7A6F64" fontSize={10} tickLine={false} />
                        <YAxis stroke="#7A6F64" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="revenue" 
                          stroke="var(--primary, #B85C38)" 
                          strokeWidth={2} 
                          fillOpacity={1} 
                          fill="url(#colorRevenue)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Gathering platform transactions history...
                    </div>
                  )}
                </div>
              </div>

              {/* Status Distributions */}
              <div className="bg-[#252019] border border-border/10 p-6 rounded-lg space-y-6">
                <h3 className="font-serif text-lg text-[#F5F0E8] font-bold">Order Pipelines</h3>
                <div className="space-y-4">
                  {STATUS_OPTIONS.map(opt => {
                    const count = orders.filter(o => o.tracking_status === opt.value).length
                    const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0
                    return (
                      <div key={opt.value} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-mono uppercase tracking-wider">
                          <span className="text-muted-foreground">{opt.label}</span>
                          <span className="text-[#F5F0E8] font-bold">{count} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-[#1C1814] rounded-full overflow-hidden border border-border/5">
                          <div 
                            className="h-full bg-primary transition-all duration-500" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: USERS DIRECTORY ── */}
        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Search Filter Tools */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#252019] border border-border/10 p-4 rounded-lg">
              <div className="relative w-full sm:max-w-md">
                <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user profiles by name, email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm font-mono text-[#F5F0E8] pl-10 pr-4 py-2 focus:outline-none rounded"
                />
              </div>
              <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                Showing {filteredUsers.length} of {users.length} users
              </div>
            </div>

            {/* Users Data Grid Table */}
            <div className="bg-[#252019] border border-border/10 rounded-lg overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 bg-[#1C1814]/40 text-muted-foreground text-[10px] uppercase tracking-wider font-mono">
                      <th className="py-4 px-6">Client Profile</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Joined Date</th>
                      <th className="py-4 px-6 text-center">Events</th>
                      <th className="py-4 px-6 text-center">Albums</th>
                      <th className="py-4 px-6 text-center">Orders</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-sm">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-muted-foreground font-mono text-xs uppercase">
                          No users found matching query parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => {
                        const isExpanded = expandedUserId === u.id
                        const isBanned = u.is_banned || false
                        const isToggling = updatingUserId === u.id

                        return (
                          <React.Fragment key={u.id}>
                            <tr className={`hover:bg-[#1C1814]/30 transition-colors ${isExpanded ? 'bg-[#1C1814]/20' : ''} ${isBanned ? 'opacity-70 bg-red-950/5' : ''}`}>
                              
                              {/* Avatar & Email */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded border flex items-center justify-center font-serif text-sm font-bold shadow-sm ${getAvatarBg(u.full_name || u.email)}`}>
                                    {(u.full_name || u.email).charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-serif font-bold text-[#F5F0E8]">{u.full_name || 'Guest User'}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{u.email}</div>
                                  </div>
                                </div>
                              </td>

                              {/* Banned Badge */}
                              <td className="py-4 px-6">
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider border rounded-full uppercase ${
                                    isBanned
                                      ? 'bg-red-950/40 text-red-400 border-red-900/50'
                                      : 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                                  }`}
                                >
                                  {isBanned ? 'Suspended' : 'Active'}
                                </span>
                              </td>

                              {/* Created date */}
                              <td className="py-4 px-6 text-muted-foreground font-mono text-xs">
                                {new Date(u.created_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>

                              {/* Counts */}
                              <td className="py-4 px-6 text-center font-mono font-semibold">{u.event_count}</td>
                              <td className="py-4 px-6 text-center font-mono font-semibold">{u.album_count}</td>
                              <td className="py-4 px-6 text-center font-mono font-semibold">{u.order_count}</td>

                              {/* Table row actions */}
                              <td className="py-4 px-6 text-right space-x-4">
                                <button
                                  disabled={isToggling}
                                  onClick={() => handleToggleUserBan(u.id, isBanned)}
                                  className={`text-[10px] font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer ${
                                    isBanned ? 'text-emerald-400 hover:text-emerald-300' : 'text-rose-400 hover:text-rose-300'
                                  }`}
                                >
                                  {isBanned ? (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      Activate
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3.5 h-3.5" />
                                      Suspend
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => handleUserClick(u.id)}
                                  className="text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1 bg-transparent border-none cursor-pointer"
                                >
                                  {isExpanded ? 'Collapse' : 'Activity'}
                                  <ChevronDown className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </td>
                            </tr>

                            {/* User Expanded details (Activity drawer) */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 bg-[#1C1814]/40 border-b border-border/10">
                                  <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between border-b border-border/10 pb-3">
                                      <h4 className="font-serif text-base text-[#F5F0E8] font-bold">
                                        Active events hosted by {u.full_name || u.email}
                                      </h4>
                                    </div>

                                    {loadingEvents === u.id ? (
                                      <div className="py-8 flex justify-center">
                                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                      </div>
                                    ) : !userEvents[u.id] || userEvents[u.id].length === 0 ? (
                                      <div className="py-6 text-center text-muted-foreground text-xs font-mono uppercase tracking-wider">
                                        No registered events for this host.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {userEvents[u.id].map(event => {
                                          const isEventSelected = selectedEventId === event.id
                                          return (
                                            <div
                                              key={event.id}
                                              className={`border p-4 rounded transition-all flex flex-col justify-between ${
                                                isEventSelected ? 'border-primary bg-primary/5' : 'border-border/10 bg-[#252019] hover:border-border/30'
                                              }`}
                                            >
                                              <div>
                                                <div className="flex justify-between items-start gap-4 mb-3">
                                                  <h5 className="font-serif font-bold text-[#F5F0E8] text-sm truncate">{event.title}</h5>
                                                  <span className="text-[9px] font-mono bg-[#1C1814] px-2 py-0.5 border border-border/10 text-primary uppercase tracking-wider">
                                                    Invite: {event.invite_code || 'N/A'}
                                                  </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 text-[9px] font-mono text-muted-foreground bg-[#1C1814]/50 p-2 rounded mb-4">
                                                  <div>
                                                    <div>DATE</div>
                                                    <span className="text-[#F5F0E8]">{event.event_date ? new Date(event.event_date).toLocaleDateString('en-IN') : 'N/A'}</span>
                                                  </div>
                                                  <div className="text-center border-x border-border/10">
                                                    <div>PHOTOS</div>
                                                    <span className="text-foreground font-bold">{event.photo_count}</span>
                                                  </div>
                                                  <div className="text-right">
                                                    <div>ALBUMS</div>
                                                    <span className="text-foreground font-bold">{event.album_count}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              <button
                                                onClick={() => handleEventClick(event.id, event.title)}
                                                className={`w-full py-1.5 text-[9px] font-mono uppercase tracking-widest border rounded transition-colors bg-transparent cursor-pointer ${
                                                  isEventSelected
                                                    ? 'border-primary text-primary'
                                                    : 'border-border/20 text-muted-foreground hover:text-[#F5F0E8] hover:border-border/40'
                                                }`}
                                              >
                                                {isEventSelected ? 'Collapse Inspection' : 'Inspect Assets'}
                                              </button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}

                                    {/* Selected Event details */}
                                    {selectedEventId && (
                                      <div className="mt-6 border-t border-border/10 pt-6 space-y-6 animate-in slide-in-from-bottom duration-300">
                                        <h5 className="font-serif text-sm text-[#F5F0E8] font-bold">
                                          Inspecting Assets: <span className="text-primary italic">&quot;{selectedEventTitle}&quot;</span>
                                        </h5>

                                        {loadingDetails === selectedEventId ? (
                                          <div className="py-8 flex justify-center">
                                            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            
                                            {/* Event Photos */}
                                            <div className="space-y-3">
                                              <h6 className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                                                Uploaded Images ({eventPhotos[selectedEventId]?.length || 0})
                                              </h6>
                                              {!eventPhotos[selectedEventId] || eventPhotos[selectedEventId].length === 0 ? (
                                                <div className="p-8 border border-dashed border-border/10 rounded text-center text-xs text-muted-foreground font-mono">
                                                  No photos uploaded yet.
                                                </div>
                                              ) : (
                                                <div className="grid grid-cols-4 gap-2 max-h-[250px] overflow-y-auto pr-1">
                                                  {eventPhotos[selectedEventId].map(photo => (
                                                    <div key={photo.id} className="aspect-square bg-[#1C1814] relative group overflow-hidden border border-border/10 rounded">
                                                      <img src={photo.blob_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                      <div className="absolute bottom-0 inset-x-0 bg-black/85 p-1 text-[8px] font-mono text-muted-foreground flex justify-between">
                                                        <span className="truncate max-w-[40px]">{photo.uploaded_by_role}</span>
                                                        <span>{photo.status}</span>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>

                                            {/* Event Albums */}
                                            <div className="space-y-3">
                                              <h6 className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                                                Draft / Printed Albums ({eventAlbums[selectedEventId]?.length || 0})
                                              </h6>
                                              {!eventAlbums[selectedEventId] || eventAlbums[selectedEventId].length === 0 ? (
                                                <div className="p-8 border border-dashed border-border/10 rounded text-center text-xs text-muted-foreground font-mono">
                                                  No albums created yet.
                                                </div>
                                              ) : (
                                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                                  {eventAlbums[selectedEventId].map(album => (
                                                    <div key={album.id} className="p-3 bg-[#252019] border border-border/10 rounded flex justify-between items-center">
                                                      <div>
                                                        <h6 className="font-serif font-bold text-xs text-[#F5F0E8]">{album.title}</h6>
                                                        <p className="text-[9px] font-mono text-muted-foreground mt-0.5">
                                                          Status: <span className="uppercase text-primary">{album.status || 'draft'}</span>
                                                        </p>
                                                      </div>
                                                      <div className="text-[9px] text-muted-foreground font-mono bg-[#1C1814] px-2 py-0.5 border border-border/5 rounded">
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
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: ORDERS MANAGER ── */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Search Filter Tooling */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#252019] border border-border/10 p-4 rounded-lg">
              <div className="relative w-full md:max-w-md">
                <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search orders by ID, email, publication title..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm font-mono text-[#F5F0E8] pl-10 pr-4 py-2 focus:outline-none rounded"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0">Filter Pipeline:</label>
                <select
                  value={orderFilterStatus}
                  onChange={e => setOrderFilterStatus(e.target.value)}
                  className="bg-[#1C1814] border border-border/10 focus:border-primary/50 text-xs font-mono text-[#F5F0E8] px-3 py-2 rounded focus:outline-none w-full md:w-48"
                >
                  <option value="all">All Queues</option>
                  <option value="paid">Paid Transactions</option>
                  <option value="pending">Pending Payments</option>
                  <option value="order placed">Order Placed</option>
                  <option value="reviewed by humans">Approved by Designer</option>
                  <option value="finalize design">Finalize Design</option>
                  <option value="printed">Printed</option>
                  <option value="out for delivery">Out for Delivery</option>
                  <option value="order arrived">Order Arrived</option>
                </select>
              </div>
            </div>

            {/* Orders list table */}
            <div className="bg-[#252019] border border-border/10 rounded-lg overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 bg-[#1C1814]/40 text-muted-foreground text-[10px] uppercase tracking-wider font-mono">
                      <th className="py-4 px-6">Order ID / Date</th>
                      <th className="py-4 px-6">Product / Client</th>
                      <th className="py-4 px-6 text-center">Qty</th>
                      <th className="py-4 px-6 text-right">Price Summary</th>
                      <th className="py-4 px-6 text-center">Payment Status</th>
                      <th className="py-4 px-6">Assigned Artist</th>
                      <th className="py-4 px-6">Print Export</th>
                      <th className="py-4 px-6">Tracking status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-sm">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-muted-foreground font-mono text-xs uppercase">
                          No print orders found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const trackingStatus = order.tracking_status || 'order placed'
                        const isUpdating = updatingOrderId === order.id
                        const address = order.shipping_address || {}
                        const statusOption = STATUS_OPTIONS.find(opt => opt.value === trackingStatus) || STATUS_OPTIONS[0]

                        return (
                          <tr key={order.id} className="hover:bg-[#1C1814]/30 transition-colors">
                            
                            {/* Order ID & Date */}
                            <td className="py-4 px-6">
                              <div className="font-mono text-xs font-bold text-[#F5F0E8] truncate max-w-[100px]" title={order.id}>
                                {order.id.substring(0, 8).toUpperCase()}...
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>

                            {/* Product & User details */}
                            <td className="py-4 px-6">
                              <div className="font-serif font-bold text-sm text-[#F5F0E8]">{order.album_title || 'Untitled Publication'}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {order.user_full_name} ({order.user_email})
                              </div>
                              
                              <div className="flex flex-wrap gap-2 items-center mt-1.5">
                                <span className="text-[9px] font-mono bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2 rounded uppercase">
                                  {order.product_type}
                                </span>
                                {address.phone && (
                                  <span className="text-[9px] font-mono text-muted-foreground bg-[#1C1814] border border-border/10 px-1.5 py-0.2 rounded flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" />
                                    {address.phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Qty */}
                            <td className="py-4 px-6 text-center font-mono font-semibold">{order.quantity}</td>

                            {/* Total price */}
                            <td className="py-4 px-6 text-right font-mono font-semibold text-primary">
                              {formatPrice(order.total_price)}
                            </td>

                            {/* Payment */}
                            <td className="py-4 px-6 text-center">
                              <span
                                className={`px-2.5 py-0.5 text-[9px] uppercase font-bold font-mono tracking-wider border rounded-full ${
                                  order.payment_status === 'paid'
                                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50'
                                    : 'bg-amber-950/40 text-amber-400 border-amber-900/50'
                                }`}
                              >
                                {order.payment_status}
                              </span>
                            </td>

                            {/* Assigned Artist Dropdown */}
                            <td className="py-4 px-6">
                              <select
                                value={order.artist_id || ''}
                                disabled={updatingArtistOrderId === order.id}
                                onChange={(e) => handleArtistChangeForOrder(order.id, e.target.value || null)}
                                className="bg-[#1C1814] border border-border/10 focus:border-primary/50 text-xs font-mono text-[#F5F0E8] px-2 py-1.5 rounded focus:outline-none w-44"
                              >
                                <option value="">Unassigned (Auto)</option>
                                {artists.map(art => (
                                  <option key={art.user_id} value={art.user_id}>
                                    {art.full_name || art.name} ({art.current_order_count} active)
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Live print PDF export progress + download */}
                            <td className="py-4 px-6">
                              <PrintJobProgress orderId={order.id} compact showDownload />
                            </td>

                            {/* Status picker select dropdown */}
                            <td className="py-4 px-6">
                              <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => setOpenStatusDropdownId(openStatusDropdownId === order.id ? null : order.id)}
                                  className={`inline-flex items-center justify-between w-48 px-3 py-1.5 text-xs font-mono font-semibold border rounded transition-all duration-150 focus:outline-none ${statusOption.color} ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                >
                                  <span>{statusOption.label}</span>
                                  {isUpdating ? (
                                    <div className="w-3.5 h-3.5 border-2 border-primary/20 border-t-primary rounded-full animate-spin shrink-0 ml-2" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-2" />
                                  )}
                                </button>

                                {openStatusDropdownId === order.id && (
                                  <div className="absolute right-0 bottom-full mb-1 z-50 w-48 bg-[#211D19] border border-border/20 rounded shadow-2xl font-mono text-xs overflow-hidden max-h-48 overflow-y-auto">
                                    {STATUS_OPTIONS.map(opt => (
                                      <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => {
                                          handleStatusChange(order.id, opt.value)
                                          setOpenStatusDropdownId(null)
                                        }}
                                        className={`w-full text-left px-3 py-2 transition-colors hover:bg-primary/10 text-[#F5F0E8] ${
                                          trackingStatus === opt.value ? 'bg-primary/20 text-primary font-bold' : ''
                                        }`}
                                      >
                                        {opt.label}
                                      </button>
                                    ))}
                                  </div>
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
          </div>
        )}

        {/* ── TAB: CONCIERGE PROJECTS ── */}
        {activeTab === 'concierge' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Search Filter Tooling */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#252019] border border-border/10 p-4 rounded-lg">
              <div className="relative w-full">
                <Search className="w-4.5 h-4.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search concierge projects by ID, user email, package..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm font-mono text-[#F5F0E8] pl-10 pr-4 py-2 focus:outline-none rounded"
                />
              </div>
            </div>

            {/* Concierge projects table */}
            <div className="bg-[#252019] border border-border/10 rounded-lg overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 bg-[#1C1814]/40 text-muted-foreground text-[10px] uppercase tracking-wider font-mono">
                      <th className="py-4 px-6">Project ID / Date</th>
                      <th className="py-4 px-6">Package / Client</th>
                      <th className="py-4 px-6 text-right">Budget Details</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">Assigned Designer</th>
                      <th className="py-4 px-6 text-center">Uploads / Proofs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10 text-sm">
                    {premiumProjects.filter(p => {
                      const matchesSearch = 
                        p.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        p.user_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        p.user_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        (p.package_name && p.package_name.toLowerCase().includes(orderSearch.toLowerCase()))
                      return matchesSearch
                    }).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground font-mono text-xs uppercase">
                          No premium concierge projects found.
                        </td>
                      </tr>
                    ) : (
                      premiumProjects.filter(p => {
                        const matchesSearch = 
                          p.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          p.user_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          p.user_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          (p.package_name && p.package_name.toLowerCase().includes(orderSearch.toLowerCase()))
                        return matchesSearch
                      }).map(project => {
                        const statusColors: Record<string, string> = {
                          'briefing-received': 'text-zinc-400 bg-zinc-950/60 border-zinc-800',
                          'editor-assigned': 'text-blue-400 bg-blue-950/60 border-blue-900/50',
                          'first-draft': 'text-purple-400 bg-purple-950/60 border-purple-900/50',
                          'revisions-requested': 'text-rose-400 bg-rose-950/60 border-rose-900/50',
                          'final-approval': 'text-emerald-400 bg-emerald-950/60 border-emerald-900/50',
                          'printing': 'text-cyan-400 bg-cyan-950/60 border-cyan-900/50',
                        }
                        const statusColor = statusColors[project.status] || 'text-zinc-400 bg-zinc-950/60 border-zinc-800'
                        
                        const uploadsCount = Array.isArray(project.photo_uploads) ? project.photo_uploads.length : 0
                        const proofsCount = Array.isArray(project.proofs) ? project.proofs.length : 0

                        return (
                          <tr key={project.id} className="hover:bg-[#1C1814]/30 transition-colors">
                            
                            {/* Project ID & Date */}
                            <td className="py-4 px-6">
                              <div className="font-mono text-xs font-bold text-[#F5F0E8] truncate max-w-[100px]" title={project.id}>
                                {project.id.substring(0, 8).toUpperCase()}...
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-1">
                                {new Date(project.created_at).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>

                            {/* Package & User */}
                            <td className="py-4 px-6">
                              <div className="font-serif font-bold text-sm text-[#F5F0E8]">{project.package_name || 'Premium Package'}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                                {project.user_name} ({project.user_email})
                              </div>
                            </td>

                            {/* Budget Details */}
                            <td className="py-4 px-6 text-right">
                              <div className="font-mono font-semibold text-primary">
                                Total: {formatPrice(project.advance_payment_amount + project.balance_amount)}
                              </div>
                              <div className="text-[10px] text-muted-foreground font-mono mt-1 space-y-0.5">
                                <div>Adv: {formatPrice(project.advance_payment_amount)} {project.advance_paid_at ? '✅ Paid' : '⏳ Pending'}</div>
                                <div>Bal: {formatPrice(project.balance_amount)} {project.balance_paid_at ? '✅ Paid' : '⏳ Pending'}</div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2 py-0.5 text-[9px] uppercase font-bold font-mono tracking-wider border rounded-full ${statusColor}`}>
                                {project.status.replace('-', ' ')}
                              </span>
                            </td>

                            {/* Assigned Designer */}
                            <td className="py-4 px-6">
                              <select
                                value={project.editor_id || ''}
                                disabled={updatingArtistProjectId === project.id}
                                onChange={(e) => handleArtistChangeForPremiumProject(project.id, e.target.value || null)}
                                className="bg-[#1C1814] border border-border/10 focus:border-primary/50 text-xs font-mono text-[#F5F0E8] px-2 py-1.5 rounded focus:outline-none w-44"
                              >
                                <option value="">Unassigned (Auto on Deposit)</option>
                                {artists.map(art => (
                                  <option key={art.user_id} value={art.user_id}>
                                    {art.full_name || art.name} ({art.current_order_count} active)
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Uploads / Proofs count */}
                            <td className="py-4 px-6 text-center font-mono text-xs">
                              <div>Photos: <span className="font-bold text-[#F5F0E8]">{uploadsCount}</span></div>
                              <div className="text-[10px] text-muted-foreground mt-0.5">Proofs: <span className="font-bold text-secondary">{proofsCount}</span></div>
                            </td>

                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: COUPONS MANAGER ── */}
        {activeTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            
            {/* Generate Coupon Form */}
            <div className="bg-[#252019] border border-border/10 p-5 rounded-lg h-fit space-y-6">
              <div className="flex items-center gap-2 border-b border-border/10 pb-3">
                <Plus className="w-5 h-5 text-primary" />
                <h3 className="font-serif text-base font-bold text-[#F5F0E8]">Generate Promo Coupon</h3>
              </div>

              <form onSubmit={handleCreatePromo} className="space-y-4 font-mono text-xs">
                
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Coupon Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. EXTRA30"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon((prev: any) => ({ ...prev, code: e.target.value }))}
                    className="w-full bg-[#1C1814] border border-border/10 px-3 py-2 text-sm text-[#F5F0E8] focus:outline-none focus:border-primary/50 rounded uppercase tracking-wider"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Type</label>
                    <select
                      value={newCoupon.discount_type}
                      onChange={e => setNewCoupon((prev: any) => ({ ...prev, discount_type: e.target.value as any }))}
                      className="w-full bg-[#1C1814] border border-border/10 px-2 py-2 text-xs text-[#F5F0E8] focus:outline-none focus:border-primary/50 rounded"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed (Rs.)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Value</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 20"
                      value={newCoupon.discount_value}
                      onChange={e => setNewCoupon((prev: any) => ({ ...prev, discount_value: e.target.value }))}
                      className="w-full bg-[#1C1814] border border-border/10 px-3 py-2 text-xs text-[#F5F0E8] focus:outline-none focus:border-primary/50 rounded"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Minimum Order Subtotal (Rs.)</label>
                  <input
                    type="number"
                    placeholder="e.g. 1000 (optional)"
                    value={newCoupon.min_order_value}
                    onChange={e => setNewCoupon((prev: any) => ({ ...prev, min_order_value: e.target.value }))}
                    className="w-full bg-[#1C1814] border border-border/10 px-3 py-2 text-xs text-[#F5F0E8] focus:outline-none focus:border-primary/50 rounded"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-muted-foreground block">Expires at</label>
                  <input
                    type="date"
                    value={newCoupon.expires_at}
                    onChange={e => setNewCoupon((prev: any) => ({ ...prev, expires_at: e.target.value }))}
                    className="w-full bg-[#1C1814] border border-border/10 px-3 py-2 text-xs text-[#F5F0E8] focus:outline-none focus:border-primary/50 rounded"
                  />
                </div>

                <Button type="submit" className="w-full py-4.5 text-[10px] font-bold uppercase tracking-widest mt-4">
                  Deploy Promo Code
                </Button>
              </form>
            </div>

            {/* Existing Active Promotions */}
            <div className="bg-[#252019] border border-border/10 rounded-lg overflow-hidden shadow-2xl lg:col-span-2 space-y-4">
              
              <div className="px-6 py-4 border-b border-border/10 flex justify-between items-center">
                <h3 className="font-serif text-base font-bold text-[#F5F0E8] flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Active System Promotions
                </h3>
                <button 
                  onClick={loadCouponsList}
                  className="text-[9px] font-mono text-primary uppercase tracking-widest flex items-center gap-1 bg-transparent border border-border/10 hover:border-primary/50 px-2.5 py-1 rounded cursor-pointer transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reload
                </button>
              </div>

              <div className="overflow-x-auto font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/10 bg-[#1C1814]/40 text-muted-foreground text-[10px] uppercase tracking-wider font-semibold">
                      <th className="py-4 px-6">Coupon Code</th>
                      <th className="py-4 px-6">Discount structure</th>
                      <th className="py-4 px-6">Min Order constraint</th>
                      <th className="py-4 px-6">Expiration time</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {loadingCoupons ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs uppercase tracking-wider">
                          Retrieving promotional values...
                        </td>
                      </tr>
                    ) : coupons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground text-xs uppercase tracking-wider">
                          No promo codes have been issued.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c: any) => (
                        <tr key={c.code} className="hover:bg-[#1C1814]/30 transition-colors">
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary font-bold tracking-wider rounded uppercase">
                              {c.code}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-[#F5F0E8] uppercase text-xs">
                            {c.discount_type === 'percentage' ? `${c.discount_value}% Discount` : `${formatPrice(c.discount_value)} Off`}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {c.min_order_value > 0 ? `Subtotal ≥ ${formatPrice(c.min_order_value)}` : 'None'}
                          </td>
                          <td className="py-4 px-6 text-muted-foreground">
                            {c.expires_at ? (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(c.expires_at).toLocaleDateString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-secondary font-bold">Permanent</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleDeletePromo(c.code)}
                              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded border border-transparent hover:border-rose-900/30 bg-transparent cursor-pointer transition"
                              title="Revoke promo code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ── TAB 5: SYSTEM CONFIGURATIONS ── */}
        {activeTab === 'settings' && (
          <div className="bg-[#252019] border border-border/10 p-6 sm:p-8 rounded-lg shadow-2xl max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8">
            
            <div className="flex items-center gap-3 border-b border-border/10 pb-4">
              <Settings className="w-6 h-6 text-primary animate-spin" style={{ animationDuration: '8s' }} />
              <div>
                <h3 className="font-serif text-xl font-bold text-[#F5F0E8]">Global Platform Configuration</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Control live pricing indexes, physical page limitations, and standard checkout constraints.</p>
              </div>
            </div>

            {loadingSettings ? (
              <div className="py-12 flex flex-col justify-center items-center gap-3 text-xs font-mono">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-muted-foreground">Loading database parameters...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveSettings} className="space-y-6 font-mono text-xs">
                
                {/* Section A: Live Catalog Base Pricing */}
                <div className="space-y-4 bg-[#1C1814]/30 p-4 border border-border/5 rounded">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-bold flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Base Publication Pricing Index (INR)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Softcover Album base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={settings.pricing.softcover_rs !== undefined ? settings.pricing.softcover_rs : (settings.pricing.softcover / 100)}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            pricing: { ...prev.pricing, softcover_rs: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pl-7 pr-3 py-2 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Hardcover Album base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={settings.pricing.hardcover_rs !== undefined ? settings.pricing.hardcover_rs : (settings.pricing.hardcover / 100)}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            pricing: { ...prev.pricing, hardcover_rs: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pl-7 pr-3 py-2 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Polaroid Photo base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={settings.pricing.polaroid_rs !== undefined ? settings.pricing.polaroid_rs : (settings.pricing.polaroid / 100)}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            pricing: { ...prev.pricing, polaroid_rs: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pl-7 pr-3 py-2 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section B: Document Layout and Spreads Limits */}
                <div className="space-y-4 bg-[#1C1814]/30 p-4 border border-border/5 rounded">
                  <span className="text-[10px] uppercase tracking-wider text-secondary font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Document Spreads & Pages limitations
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Softcover Max Pages limit</label>
                      <input
                        type="number"
                        required
                        value={settings.page_limits.softcover}
                        onChange={e => setSettings((prev: any) => ({
                          ...prev,
                          page_limits: { ...prev.page_limits, softcover: e.target.value }
                        }))}
                        className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] px-3 py-2 rounded focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Hardcover Max Pages limit</label>
                      <input
                        type="number"
                        required
                        value={settings.page_limits.hardcover}
                        onChange={e => setSettings((prev: any) => ({
                          ...prev,
                          page_limits: { ...prev.page_limits, hardcover: e.target.value }
                        }))}
                        className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] px-3 py-2 rounded focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Min Required Pages</label>
                      <input
                        type="number"
                        required
                        value={settings.min_pages}
                        onChange={e => setSettings((prev: any) => ({ ...prev, min_pages: e.target.value }))}
                        className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] px-3 py-2 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Tax Rate and Shipping Thresholds */}
                <div className="space-y-4 bg-[#1C1814]/30 p-4 border border-border/5 rounded">
                  <span className="text-[10px] uppercase tracking-wider text-[#7A6F64] font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Government GST Tax & Shipping variables
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Tax Rate (%)</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          value={settings.shipping_and_tax.tax_rate}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            shipping_and_tax: { ...prev.shipping_and_tax, tax_rate: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pr-7 pl-3 py-2 rounded focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Standard Shipping Fee</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={settings.shipping_and_tax.shipping_fee_rs !== undefined ? settings.shipping_and_tax.shipping_fee_rs : (settings.shipping_and_tax.shipping_fee / 100)}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            shipping_and_tax: { ...prev.shipping_and_tax, shipping_fee_rs: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pl-7 pr-3 py-2 rounded focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Free Shipping Threshold</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={settings.shipping_and_tax.free_shipping_threshold_rs !== undefined ? settings.shipping_and_tax.free_shipping_threshold_rs : (settings.shipping_and_tax.free_shipping_threshold / 100)}
                          onChange={e => setSettings((prev: any) => ({
                            ...prev,
                            shipping_and_tax: { ...prev.shipping_and_tax, free_shipping_threshold_rs: e.target.value }
                          }))}
                          className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] pl-7 pr-3 py-2 rounded focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section D: Quantity Limit Scales */}
                <div className="space-y-4 bg-[#1C1814]/30 p-4 border border-border/5 rounded">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Transaction print copies margins
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Min Copies in cart</label>
                      <input
                        type="number"
                        required
                        value={settings.min_max_copies.min}
                        onChange={e => setSettings((prev: any) => ({
                          ...prev,
                          min_max_copies: { ...prev.min_max_copies, min: e.target.value }
                        }))}
                        className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] px-3 py-2 rounded focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-muted-foreground block text-[9px] uppercase tracking-wider">Max Copies in cart</label>
                      <input
                        type="number"
                        required
                        value={settings.min_max_copies.max}
                        onChange={e => setSettings((prev: any) => ({
                          ...prev,
                          min_max_copies: { ...prev.min_max_copies, max: e.target.value }
                        }))}
                        className="w-full bg-[#1C1814] border border-border/10 focus:border-primary/50 text-sm text-[#F5F0E8] px-3 py-2 rounded focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Save button panel */}
                <div className="pt-6 border-t border-border/10 flex justify-end">
                  <Button type="submit" className="px-8 py-4.5 text-[10px] font-bold uppercase tracking-widest hover:scale-102 transition-transform">
                    Save system configurations
                  </Button>
                </div>

              </form>
            )}
          </div>
        )}

      </main>
      
      {/* Mini Footer */}
      <footer className="w-full border-t border-border/5 py-4 bg-[#1C1814]">
        <div className="max-w-7xl mx-auto px-6 text-center text-[9px] font-mono text-muted-foreground uppercase tracking-wider">
          © {new Date().getFullYear()} Folio Inc. Security Area. Operations monitored and logged.
        </div>
      </footer>

    </div>
  )
}
