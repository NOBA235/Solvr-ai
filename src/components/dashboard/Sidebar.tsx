'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { PLANS } from '@/lib/stripe/plans'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SoVLogo from '@/components/SoVLogo';

const NAV: { href: string; icon: string; label: string; adminOnly?: boolean }[] = [
  { href: '/dashboard',       icon: '🏠', label: 'Home'       },
  { href: '/dashboard/solve', icon: '🔬', label: 'Solve'      },
  { href: '/dashboard/lab',   icon: '⚗️', label: 'Virtual Lab' },
  { href: '/dashboard/history',icon: '📋', label: 'History'   },
  { href: '/dashboard/settings',icon: '⚙️',label: 'Settings'  },
  { href: '/dashboard/admin',   icon: '🧠', label: 'Knowledge Base', adminOnly: true },
]

export default function DashboardSidebar({ profile }: { profile: Profile | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const plan = PLANS[profile?.plan || 'free']
  const limit = plan.limits.problemsPerMonth
  const used = profile?.problems_used || 0
  const pct = limit === -1 ? 100 : Math.min(100, Math.round((used / limit) * 100))

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [mobileOpen])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-5 border-b border-line">
        <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
          <span className="text-xl">🔬</span>
          <span className="text-base font-extrabold text-primary group-hover:text-primary/80 transition-colors">Solvr AI</span>
        </Link>
        <p className="text-[10px] text-muted font-mono mt-1 ml-0.5">← back to home</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.filter(n => !n.adminOnly || profile?.role === 'admin').map(({ href, icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const locked = href === '/dashboard/lab' && profile?.plan === 'free'
          return (
            <Link 
              key={href} 
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:text-ink hover:bg-line/30'
              } ${locked ? 'opacity-50' : ''}`}>
              <span>{icon}</span>
              <span>{label}</span>
              {locked && (
                <span className="ml-auto text-[9px] bg-amber-100 text-amber-700 font-mono px-1.5 py-0.5 rounded border border-amber-200">
                  PRO
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usage */}
      <div className="p-4 border-t border-line">
        <div className="bg-paper rounded-xl p-3 mb-3 border border-line">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono text-muted">Problems</span>
            <span className="text-xs font-mono text-ink/70">
              {used}/{limit === -1 ? '∞' : limit}
            </span>
          </div>
          <div className="w-full bg-line rounded-full h-1.5 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${pct}%`, 
                background: pct > 80 ? '#DC2626' : '#2563EB' 
              }} 
            />
          </div>
          {profile?.plan === 'free' && (
            <Link 
              href="/pricing" 
              onClick={() => setMobileOpen(false)}
              className="block text-center text-xs text-primary font-mono mt-2 hover:underline"
            >
              Upgrade plan →
            </Link>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate text-ink">
              {profile?.username || 'User'}
            </div>
            <div className="text-[10px] font-mono text-muted capitalize">
              {profile?.plan || 'free'} plan
            </div>
          </div>
          <button 
            onClick={logout} 
            title="Sign out"
            className="text-muted hover:text-ink transition-colors text-lg p-1 hover:bg-line/30 rounded-lg"
          >
            ↩
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-0 left-0 z-50 m-4 p-2.5 bg-white border border-line rounded-xl shadow-lg hover:shadow-xl transition-all lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <svg 
            className="w-5 h-5 text-ink" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-white border-r border-line flex flex-col h-full flex-shrink-0 shadow-sm">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Overlay & Drawer */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-line flex flex-col z-50 shadow-2xl lg:hidden"
            >
              {/* Close button inside drawer */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 hover:bg-line/30 rounded-lg transition-colors text-muted hover:text-ink"
                  aria-label="Close menu"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}