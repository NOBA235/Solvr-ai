//src>app>page.tsx
'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import SoVLogo from '@/components/SoVLogo';
const SUBJECTS = [
  { icon: '📐', name: 'Mathematics', color: '#2563EB', bgColor: 'bg-surface-blue', examples: ['Integrate ∫sin(x)dx', 'Solve quadratic ax²+bx+c=0', 'Matrix eigenvectors'] },
  { icon: '⚡', name: 'Physics', color: '#7C3AED', bgColor: 'bg-purple-50', examples: ['F = ma problem', 'Circuit analysis', 'Projectile motion'] },
  { icon: '⚗️', name: 'Chemistry', color: '#059669', bgColor: 'bg-surface-green', examples: ['Balance redox equation', 'Titration calculations', 'Orbital hybridisation'] },
  { icon: '🧬', name: 'Biology', color: '#DC2626', bgColor: 'bg-red-50', examples: ['DNA replication', 'Enzyme kinetics', 'Photosynthesis equation'] },
]

const STEPS = [
  { icon: '📸', title: 'Snap or Type', desc: 'Upload a photo of your textbook, worksheet, or type the problem directly' },
  { icon: '🧠', title: 'AI Analyses', desc: 'Claude AI reads the problem, identifies the topic and relevant formulas' },
  { icon: '📋', title: 'Step-by-Step', desc: 'Get a full worked solution with every step explained in plain English' },
]

const STATS = [
  { val: '4 Subjects', sub: 'Maths, Physics, Chemistry, Biology' },
  { val: '< 5 sec', sub: 'Average solution time' },
  { val: 'Step-by-step', sub: 'Every calculation shown' },
  { val: 'Virtual Labs', sub: 'Interactive simulations' },
]

export default function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [demoInput, setDemoInput] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user))
  }, [])

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (demoInput.trim()) {
      window.location.href = '/auth/register'
    }
  }

  // Placeholder rotation for demo effect
  const placeholderProblems = [
    'Solve: x² + 5x + 6 = 0',
    'Calculate the force on a 10kg object...',
    'Balance: Fe + O₂ → Fe₂O₃',
    'Explain DNA replication steps...',
  ]
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  useEffect(() => {
    if (!isFocused && !demoInput) {
      const interval = setInterval(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholderProblems.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isFocused, demoInput])

  return (
    <div className="min-h-screen bg-paper text-ink font-display">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-paper/80 backdrop-blur-xl border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="text-lg sm:text-xl">🔬</span>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-primary">Solvr AI</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs text-muted font-mono">
            <Link href="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
            <Link href="#features" className="hover:text-ink transition-colors">Features</Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-2">
            {loggedIn ? (
              <Link
                href="/dashboard"
                className="text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg"
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-xs font-mono text-muted hover:text-ink transition-colors px-3 py-2"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs font-semibold bg-primary text-white px-3.5 py-2 rounded-lg hover:bg-primary/90 transition-all hover:shadow-lg"
                >
                  Start free →
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-muted hover:text-ink transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white/95 backdrop-blur-xl border-b border-line shadow-lg"
          >
            <div className="px-4 py-4 space-y-3">
              <Link
                href="/pricing"
                className="block px-3 py-2 text-sm font-mono text-muted hover:text-ink hover:bg-line/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#features"
                className="block px-3 py-2 text-sm font-mono text-muted hover:text-ink hover:bg-line/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <div className="pt-2 border-t border-line">
                {loggedIn ? (
                  <Link
                    href="/dashboard"
                    className="block w-full text-center text-sm font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to dashboard →
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link
                      href="/auth/login"
                      className="block w-full text-center text-sm font-mono text-muted hover:text-ink px-4 py-2.5 rounded-lg border border-line hover:border-primary/30 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/register"
                      className="block w-full text-center text-sm font-semibold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Start free →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Demo UI Banner - Mobile friendly */}
      <div className="pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 bg-gradient-to-b from-white to-paper">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Subtle glow effect */}
            <div 
              className={`absolute -inset-1 bg-gradient-to-r from-primary/10 via-blue-400/10 to-primary/10 rounded-2xl blur-xl transition-opacity duration-500 ${isHovering ? 'opacity-100' : 'opacity-50'}`}
            />
            
            {/* Main Demo Card */}
            <div className="relative bg-white border border-line rounded-xl sm:rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
              {/* Demo Header */}
              <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-b border-line bg-paper/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted font-mono">Solvr AI Demo</span>
                </div>
                <div className="text-[10px] sm:text-xs text-muted font-mono">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    AI Ready
                  </span>
                </div>
              </div>

              {/* Demo Content */}
              <div className="p-3 sm:p-4">
                {/* Subject Quick Select - Horizontal scroll */}
                <div className="flex gap-1.5 sm:gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                  {SUBJECTS.map((sub) => (
                    <button
                      key={sub.name}
                      onClick={() => setSelectedSubject(selectedSubject === sub.name ? '' : sub.name)}
                      className={`flex-shrink-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-mono border transition-all whitespace-nowrap ${
                        selectedSubject === sub.name
                          ? 'border-primary bg-surface-blue text-primary font-semibold'
                          : 'border-line text-muted hover:border-primary/30 hover:text-ink'
                      }`}
                    >
                      {sub.icon} <span className="hidden sm:inline">{sub.name}</span>
                      <span className="sm:hidden">{sub.name.slice(0, 4)}</span>
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <form onSubmit={handleDemoSubmit} className="space-y-2 sm:space-y-3">
                  <div className="relative">
                    <textarea
                      value={demoInput}
                      onChange={(e) => setDemoInput(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      placeholder={isFocused ? 'Type your problem...' : placeholderProblems[currentPlaceholder]}
                      className="w-full min-h-[60px] sm:min-h-[72px] p-2.5 sm:p-3 bg-paper border border-line rounded-lg sm:rounded-xl font-mono text-xs sm:text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/5 transition-all placeholder:text-muted/50"
                      rows={2}
                    />
                    
                    {/* Upload Button Overlay */}
                    <button
                      type="button"
                      onClick={() => window.location.href = '/auth/register'}
                      className="absolute bottom-2 right-2 p-1.5 sm:p-2 bg-white border border-line rounded-lg hover:bg-surface-blue hover:border-primary/30 transition-all group"
                      title="Upload image"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>

                  {/* Action Buttons - Compact */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-white font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-primary/90 transition-all hover:shadow-md active:scale-[0.98] text-xs sm:text-sm"
                    >
                      <span>Solve</span>
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => window.location.href = '/auth/register'}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white border border-line text-muted font-mono px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl hover:bg-line/30 transition-all text-xs sm:text-sm"
                    >
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="hidden sm:inline">Upload Image</span>
                      <span className="sm:hidden">Upload</span>
                    </button>
                  </div>
                </form>

                {/* Fake response preview */}
                {demoInput.trim() && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-2.5 sm:p-3 bg-surface-blue/30 border border-primary/10 rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-3 h-3 rounded-full bg-primary/20 animate-pulse" />
                      <span className="text-[10px] sm:text-xs font-mono text-primary font-semibold">
                        Analysing...
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-primary/10 rounded w-3/4 animate-pulse" />
                      <div className="h-1.5 bg-primary/10 rounded w-1/2 animate-pulse" />
                      <div className="h-1.5 bg-primary/10 rounded w-2/3 animate-pulse" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted font-mono mt-2 text-center">
                      👆 Demo only. <Link href="/auth/register" className="text-primary hover:underline">Sign up</Link> for real solutions
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Hero Section - Mobile optimized */}
      <section className="pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Grid Background */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${/* line */ '#E5E5E0'} 1px, transparent 1px), linear-gradient(90deg, ${/* line */ '#E5E5E0'} 1px, transparent 1px)`,
            backgroundSize: '44px 44px'
          }} />
        </div>
        
        {/* Subtle Glow Effects */}
        <div className="absolute top-20 sm:top-32 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-32 sm:top-48 right-1/4 w-56 sm:w-80 h-56 sm:h-80 bg-green-100/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Badge - Smaller */}
            <div className="inline-flex items-center gap-1.5 bg-surface-blue border border-primary/20 rounded-full px-2.5 sm:px-3 py-1 text-[10px] sm:text-xs font-mono text-primary mb-4 sm:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Powered by Claude AI
            </div>

            {/* Heading - Responsive & compact */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-3 sm:mb-4 px-1">
              <span className="block">Snap any problem.</span>
              <span className="block mt-1 text-primary">Understand every step.</span>
            </h1>

            {/* Subtitle - Compact */}
            <p className="text-sm sm:text-base lg:text-lg text-muted font-mono max-w-lg mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
              Upload a photo or type any Physics, Maths, Chemistry, or Biology problem. Get step-by-step solutions.
            </p>

            {/* CTA Buttons - Small & stacked on mobile */}
            <div className="flex flex-row items-center justify-center gap-2 px-2 sm:px-0">
              <Link
                href="/auth/register"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-primary text-white font-semibold px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm hover:bg-primary/90 transition-all hover:shadow-lg"
              >
                Start free →
              </Link>
              <Link
                href="/pricing"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-white border border-line text-muted font-mono px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm hover:bg-line/30 transition-all"
              >
                Pricing
              </Link>
            </div>
            <p className="text-[10px] sm:text-xs text-muted font-mono mt-3">10 free problems/month · No credit card</p>
          </motion.div>

          {/* Demo Card - More compact */}
          <motion.div
            className="mt-8 sm:mt-10 bg-white border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 text-left max-w-md mx-auto shadow-md"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {/* Card Header */}
            <div className="flex items-start sm:items-center gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-line">
              <span className="text-lg sm:text-xl">⚡</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold truncate">Newton&apos;s Second Law</div>
                <div className="text-[10px] sm:text-xs text-muted font-mono">Medium · Solved in 2.3s</div>
              </div>
              <span className="hidden sm:inline-flex ml-auto text-[10px] font-mono text-green-700 border border-green-200 bg-surface-green px-1.5 py-0.5 rounded shrink-0">
                ✓ Solved
              </span>
            </div>

            {/* Problem */}
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="bg-paper rounded-lg p-2 sm:p-2.5 font-mono text-muted text-[11px] sm:text-xs border border-line">
                A 5kg block pushed with 20N on frictionless surface. Find acceleration.
              </div>

              {/* Steps */}
              <div className="space-y-1.5">
                {[
                  { step: '1', title: 'Identify', content: 'm = 5kg, F = 20N' },
                  { step: '2', title: 'Apply F=ma', content: 'a = F/m' },
                  { step: '3', title: 'Calculate', content: 'a = 20/5 = 4 m/s²' },
                ].map(({ step, title, content }) => (
                  <div key={step} className="flex gap-2">
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-surface-blue text-primary text-[10px] flex items-center justify-center font-mono flex-shrink-0 mt-0.5 border border-primary/20">
                      {step}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[10px] sm:text-xs font-semibold text-ink/80">{title}</div>
                      <div className="text-[10px] sm:text-xs text-muted font-mono">{content}</div>
                    </div>
                  </div>
                ))}
                
                {/* Answer */}
                <div className="bg-surface-green border border-green-200 rounded-lg px-2.5 py-1.5 font-mono text-green-700 text-[10px] sm:text-xs font-bold">
                  ✅ a = 4 m/s²
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar - Compact */}
      <section className="border-y border-line bg-surface-blue/20">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STATS.map(({ val, sub }, i) => (
            <motion.div
              key={val}
              className="text-center"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-base sm:text-lg lg:text-xl font-extrabold text-ink mb-0.5">{val}</div>
              <div className="text-[10px] sm:text-xs text-muted font-mono">{sub}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Subjects Section - Mobile grid */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-paper" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 text-ink">
              Every STEM subject
            </h2>
            <p className="text-xs sm:text-sm text-muted font-mono px-2">
              Basic arithmetic to university calculus — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {SUBJECTS.map((sub, i) => (
              <motion.div
                key={sub.name}
                className={`${sub.bgColor} border border-line rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-all group`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -2 }}
              >
                <div className="text-xl sm:text-2xl mb-1.5 sm:mb-2">{sub.icon}</div>
                <h3 className="text-xs sm:text-sm font-bold mb-1.5 sm:mb-2" style={{ color: sub.color }}>
                  {sub.name}
                </h3>
                <ul className="space-y-1">
                  {sub.examples.map((ex) => (
                    <li key={ex} className="text-[10px] sm:text-xs text-muted font-mono flex items-center gap-1.5">
                      <span
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ background: sub.color }}
                      />
                      <span className="truncate">{ex}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Compact */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-white border-t border-line">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mb-2 sm:mb-3 text-ink">
            How it works
          </h2>
          <p className="text-xs sm:text-sm text-muted font-mono mb-8 sm:mb-10">
            Three steps from problem to understanding.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-6">
            {STEPS.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                className="px-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-surface-blue border border-primary/20 flex items-center justify-center text-lg sm:text-xl mx-auto mb-2 sm:mb-3">
                  {icon}
                </div>
                <h3 className="text-sm sm:text-base font-bold mb-1.5 text-ink">{title}</h3>
                <p className="text-xs sm:text-sm text-muted font-mono leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 bg-surface-blue/20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 px-1 text-ink">
            Ready to{' '}
            <span className="text-primary">understand</span>{' '}
            your homework?
          </h2>
          <p className="text-xs sm:text-sm text-muted font-mono mb-5 sm:mb-6">
            Start with 10 free problems. No credit card needed.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1.5 bg-primary text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm hover:bg-primary/90 transition-all hover:shadow-lg"
          >
            Get started free →
          </Link>
        </div>
      </section>

      {/* Footer - Compact */}
      <footer className="border-t border-line py-4 sm:py-6 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] sm:text-xs text-muted font-mono">
          <div className="flex items-center gap-2">
            <span>🔬</span>
            <span className="text-ink font-bold">Solvr AI</span>
            <span className="hidden sm:inline">— Built for students</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Link href="/pricing" className="hover:text-ink transition-colors">Pricing</Link>
            <span className="hover:text-ink cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-ink cursor-pointer transition-colors">Terms</span>
            <span>© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  )
}