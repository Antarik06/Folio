export function Footer() {
  return (
    <footer className="bg-darkroom text-[#F5F0E8] py-16 md:py-24">
      <div className="px-6 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="font-serif text-3xl text-[#F5F0E8]">
              Folio
            </a>
            <p className="mt-4 text-sm text-[#F5F0E8]/60 max-w-xs leading-relaxed">
              Where memories become books. Collaborative photo albums that tell your story, printed with care.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#F5F0E8]/40 mb-4">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  How it works
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Templates
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Events
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-[#F5F0E8]/40 mb-4">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Journal
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-[#F5F0E8]/70 hover:text-[#F5F0E8] transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-xs text-[#F5F0E8]/40">
            © 2026 Folio. Handcrafted with care.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[#F5F0E8]/40 hover:text-[#F5F0E8]/70 transition-colors">
              Instagram
            </a>
            <a href="#" className="text-xs text-[#F5F0E8]/40 hover:text-[#F5F0E8]/70 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-xs text-[#F5F0E8]/40 hover:text-[#F5F0E8]/70 transition-colors">
              Pinterest
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
