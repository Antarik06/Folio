export function Footer() {
  return (
    <footer className="bg-darkroom text-paper py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="font-serif text-3xl text-paper">
              Folio
            </a>
            <p className="mt-4 text-sm text-paper/60 max-w-xs leading-relaxed">
              Where memories become books. AI-powered photo albums that tell your story, printed with care.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-paper/40 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Events
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-paper/40 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Journal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-paper/70 hover:text-paper transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-paper/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-paper/40">
            © 2026 Folio. Handcrafted with care.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-paper/40 hover:text-paper/70 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-xs text-paper/40 hover:text-paper/70 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-xs text-paper/40 hover:text-paper/70 transition-colors">
              Pinterest
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
