import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserOrders } from '@/lib/actions/orders'
import { getProfile, getUser } from '@/lib/actions/auth'
import { formatPrice } from '@/lib/pricing'
import { PrintJobProgress } from '@/components/album-order/print-job-progress'
import { Clock, CheckCircle2, Package, Truck, Compass, UserCheck, Check } from 'lucide-react'

// Define the steps in order
const PROGRESS_STEPS = [
  { id: 'order placed', label: 'Order Placed', icon: Clock, desc: 'We have received your print configurations' },
  { id: 'reviewed by humans', label: 'Approved by Designer', icon: UserCheck, desc: 'Our editorial experts have approved the layout' },
  { id: 'finalize design', label: 'Finalize Design', icon: Compass, desc: 'Preparing final print-ready plates' },
  { id: 'printed', label: 'Printed', icon: CheckCircle2, desc: 'Your pages are pressed onto premium cartridge paper' },
  { id: 'out for delivery', label: 'Out for Delivery', icon: Truck, desc: 'En route with our shipping partners' },
  { id: 'order arrived', label: 'Order Arrived', icon: Package, desc: 'Delivered directly to your door' }
]

export const metadata = {
  title: 'My Print Orders | Folio',
  description: 'Track the creation, design, printing, and delivery progress of your custom editorial books.'
}

export default async function MyOrdersPage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Handle special case: Super Admin trying to access this (redirect them to
  // Admin panel). Keyed on the profile role rather than a hardcoded address.
  const profile = await getProfile()
  if ((profile as any)?.role === 'admin') {
    redirect('/admin')
  }

  const rawOrders = await getUserOrders()
  
  // Filter for orders that are paid (or verify mock status)
  const orders = (rawOrders || []).filter((o: any) => o.payment_status === 'paid')

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32 mt-16">
      {/* Header */}
      <div className="mb-16 border-b border-border pb-8">
        <span className="text-[10px] uppercase tracking-[0.3em] text-primary font-bold mb-3 block">
          Order Desk
        </span>
        <h1 className="font-serif text-5xl text-foreground mb-4">My Orders</h1>
        <p className="text-muted-foreground text-sm font-light max-w-xl leading-relaxed">
          Follow the physical journey of your photo magazines from human proofing and printing to courier delivery.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border">
          <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-6" />
          <h3 className="font-serif text-2xl text-foreground mb-3">No orders yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8 font-light leading-relaxed">
            You haven't ordered any physical prints yet. Finish curating your album volume and place an order.
          </p>
          <Link
            href="/photos/events"
            className="inline-block bg-primary text-primary-foreground px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
          >
            Explore Events & Albums
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {orders.map((order: any) => {
            const currentStepIdx = PROGRESS_STEPS.findIndex(s => s.id === (order.tracking_status || 'order placed'))
            const formattedDate = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })

            // Format type label
            const typeParts = (order.product_type || '').split('_')
            const formatName = typeParts[0] ? typeParts[0].charAt(0).toUpperCase() + typeParts[0].slice(1) : 'Magazine'
            const sizeName = typeParts[1] ? typeParts[1].charAt(0).toUpperCase() + typeParts[1].slice(1) : ''

            return (
              <div key={order.id} className="bg-card border border-border overflow-hidden shadow-sm">
                
                {/* Order Top Bar Info */}
                <div className="border-b border-border bg-muted/20 px-8 py-5 flex flex-wrap gap-y-4 items-center justify-between">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Date Placed</p>
                      <p className="text-sm font-medium text-foreground">{formattedDate}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Total Paid</p>
                      <p className="text-sm font-medium text-foreground">{formatPrice(order.total_price)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1">Quantity</p>
                      <p className="text-sm font-medium text-foreground">{order.quantity} {order.quantity === 1 ? 'copy' : 'copies'}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase bg-[#EAE3D2] dark:bg-zinc-800 text-foreground px-3 py-1 border border-border">
                      ID: {order.id.substring(0, 8).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  {/* Album Cover & Details */}
                  <div className="flex flex-col sm:flex-row gap-8 mb-12 items-start">
                    <div className="w-24 aspect-[3/4] bg-background border border-border flex-shrink-0 relative overflow-hidden">
                      {order.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.cover_image_url} alt={order.album_title || 'Volume'} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/5 flex items-center justify-center text-[10px] font-serif text-primary/40 text-center p-2">
                          {order.album_title || 'Untitled Volume'}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[9px] uppercase tracking-[0.2em] bg-primary/10 text-primary px-2.5 py-1">
                          Paid & Confirmed
                        </span>
                        <span className={`text-[9px] uppercase tracking-[0.2em] px-2.5 py-1 border ${
                          order.status === 'approved' || order.status === 'sent-to-print' || order.status === 'printing' || order.status === 'completed'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : order.status === 'changes-requested'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {order.status === 'approved' || order.status === 'sent-to-print' || order.status === 'printing' || order.status === 'completed'
                            ? 'Approved by Designer'
                            : order.status === 'changes-requested'
                            ? 'Revision Requested'
                            : 'Pending Designer Review'}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl text-foreground mt-2">{order.album_title || 'Untitled Volume'}</h3>
                      <p className="text-xs text-muted-foreground font-light">
                        Specification: <strong className="text-foreground">{formatName} ({sizeName})</strong>
                      </p>
                    </div>
                  </div>

                  {/* Live print-export progress. Renders itself away until a
                      print job actually exists for this order. */}
                  <div className="mb-12">
                    <PrintJobProgress orderId={order.id} />
                  </div>

                  {/* Horizontal Visual Tracker */}
                  <div className="mt-8">
                    <div className="relative">
                      {/* Connection bar */}
                      <div className="absolute top-5 left-8 right-8 h-[2px] bg-border z-0 hidden md:block">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${(currentStepIdx / (PROGRESS_STEPS.length - 1)) * 100}%` }}
                        />
                      </div>

                      {/* Timeline Steps */}
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-6 relative z-10">
                        {PROGRESS_STEPS.map((step, idx) => {
                          const isCompleted = idx < currentStepIdx
                          const isActive = idx === currentStepIdx
                          const isPending = idx > currentStepIdx
                          const IconComp = step.icon

                          return (
                            <div key={step.id} className="flex md:flex-col items-start md:items-center text-left md:text-center group">
                              {/* Step circle */}
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 md:mb-3 flex-shrink-0 ${
                                isCompleted ? 'bg-secondary border-secondary text-secondary-foreground' :
                                isActive ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-110' :
                                'bg-card border-border text-muted-foreground'
                              }`}>
                                {isCompleted ? (
                                  <Check className="w-5 h-5" strokeWidth={3} />
                                ) : (
                                  <IconComp className="w-4 h-4" />
                                )}
                              </div>

                              {/* Step details */}
                              <div className="ml-4 md:ml-0 md:px-2">
                                <h4 className={`text-xs uppercase tracking-wider font-bold ${
                                  isActive ? 'text-primary' : 
                                  isCompleted ? 'text-secondary' : 
                                  'text-muted-foreground'
                                }`}>
                                  {step.label}
                                </h4>
                                <p className="text-[10px] text-muted-foreground font-light mt-1 hidden md:block leading-normal">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
