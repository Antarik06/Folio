import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Check, CreditCard, Truck, ShieldCheck, ArrowRight } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const { id: albumId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: album } = await supabase
    .from('albums')
    .select('*, events(title)')
    .eq('id', albumId)
    .single()

  if (!album) notFound()

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-20">
        
        {/* Left: Preview & Product Details */}
        <div className="flex-1">
          <div className="mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary mb-4 block underline underline-offset-8">Step 03</span>
            <h1 className="font-serif text-5xl text-foreground mb-4 italic">Ready to Print</h1>
            <p className="text-muted-foreground font-light text-lg">
              Review your publication details and finalize your order.
            </p>
          </div>

          <div className="aspect-[4/3] bg-muted relative overflow-hidden shadow-2xl mb-12">
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[300px] h-[400px] bg-white shadow-2xl rotate-[-5deg] transition-transform hover:rotate-0 duration-700">
                    {/* Mockup of the cover */}
                    <div className="w-full h-full border border-border p-8 flex flex-col items-center justify-center text-center gap-6">
                        <div className="w-32 h-32 rounded-full border-2 border-primary/20 flex items-center justify-center">
                             <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                        </div>
                        <h3 className="font-serif text-xl italic">{album.title}</h3>
                        <div className="h-px w-12 bg-primary/20" />
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold italic">Volume I</p>
                    </div>
                </div>
             </div>
             <div className="absolute bottom-8 left-8">
                <p className="text-[10px] uppercase tracking-widest font-bold text-ink bg-white px-4 py-2 shadow-xl">
                   Mockup Preview
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-border p-8 bg-card">
               <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-6">Specifications</h4>
               <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-light">
                     <Check className="w-4 h-4 text-primary" /> Premium 120gsm Silk Paper
                  </li>
                  <li className="flex items-center gap-3 text-sm font-light">
                     <Check className="w-4 h-4 text-primary" /> Lay-flat Binding
                  </li>
                  <li className="flex items-center gap-3 text-sm font-light">
                     <Check className="w-4 h-4 text-primary" /> Matte Scuff-resistant Cover
                  </li>
               </ul>
            </div>
            <div className="border border-border p-8 bg-card">
               <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-6">Service</h4>
               <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-sm font-light">
                     <ShieldCheck className="w-4 h-4 text-secondary" /> Quality Guarantee
                  </li>
                  <li className="flex items-center gap-3 text-sm font-light">
                     <Truck className="w-4 h-4 text-secondary" /> 5-7 Day Global Delivery
                  </li>
               </ul>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[400px]">
           <div className="bg-ink text-white p-10 shadow-2xl sticky top-24">
              <h2 className="font-serif text-3xl mb-12 italic border-b border-white/10 pb-6 text-center">Order Summary</h2>
              
              <div className="space-y-6 mb-12">
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60 font-light">Magazine Publication</span>
                    <span className="font-bold">$24.00</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                    <span className="text-white/60 font-light">Express Delivery</span>
                    <span className="font-bold text-green-400">FREE</span>
                 </div>
                 <div className="h-px bg-white/10 my-6" />
                 <div className="flex justify-between items-center text-xl">
                    <span className="font-serif italic font-light">Total</span>
                    <span className="font-bold">$24.00</span>
                 </div>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-white text-ink py-5 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-3">
                   <CreditCard className="w-4 h-4" />
                   Process Payment
                </button>
                <Link 
                  href={`/dashboard/templates/builder/${albumId}`}
                  className="w-full border border-white/20 text-white/60 py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:text-white hover:border-white transition-all flex items-center justify-center gap-3"
                >
                   Final Adjustment
                </Link>
              </div>

              <div className="mt-12 text-center">
                 <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">
                    Secure Checkout powered by Stripe
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  )
}
