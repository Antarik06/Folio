import { Navigation } from '@/components/landing/navigation'
import { Hero } from '@/components/landing/hero'
import { FeatureStrip } from '@/components/landing/feature-strip'
import { ProcessTimeline } from '@/components/landing/process-timeline'
import { EventHub } from '@/components/landing/event-hub'
import { TemplatePreview } from '@/components/landing/template-preview'
import { Testimonials } from '@/components/landing/testimonials'
import { Pricing } from '@/components/landing/pricing'
import { CTASection } from '@/components/landing/cta-section'
import { Footer } from '@/components/landing/footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <FeatureStrip />
      <section id="how-it-works">
        <ProcessTimeline />
      </section>
      <EventHub />
      <TemplatePreview />
      <Testimonials />
      <section id="pricing">
        <Pricing />
      </section>
      <CTASection />
      <Footer />
    </main>
  )
}
