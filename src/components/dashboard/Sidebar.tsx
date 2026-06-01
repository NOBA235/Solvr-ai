'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import { PLANS } from '@/lib/stripe/plans'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SoVLogo from '@/components/SoVLogo';
import { 
  FiHome, 
  FiBook,   
  FiClock, 
  FiSettings, 
  FiDatabase,
  FiLogOut,
  FiMenu,
  FiX,
  FiStar,
  FiChevronRight
} from 'react-icons/fi'
import { IoFlaskOutline } from 'react-icons/io5'
import { MdScience } from 'react-icons/md'

const NAV: { href: string; icon: any; label: string; adminOnly?: boolean }[] = [
  { href: '/dashboard',       icon: FiHome,      label: 'Home'       },
  { href: '/dashboard/solve', icon: MdScience,   label: 'Solve'      },
  { href: '/dashboard/lab',      icon: IoFlaskOutline,  label: 'Virtual Lab'    },
  { href: '/dashboard/history',icon: FiClock,    label: 'History'   },
  { href: '/dashboard/settings',icon: FiSettings,label: 'Settings'  },
  { href: '/dashboard/admin',   icon: FiDatabase, label: 'Knowledge Base', adminOnly: true },
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

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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
      {/* Logo Section */}
      <div className="p-5 border-b border-gray-200">
         <Link href="/" className="flex items-center gap-2 shrink-0">
                    <SoVLogo className="h-7 w-7 sm:h-8 sm:w-8" />
                    <span className="text-base sm:text-lg font-extrabold tracking-tight text-primary">
                      Solvr AI
                    </span>
                  </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.filter(n => !n.adminOnly || profile?.role === 'admin').map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          const locked = href === '/dashboard/lab' && profile?.plan === 'free'
          
          return (
            <Link 
              key={href} 
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              } ${locked ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
              <span className="truncate">{label}</span>
              
              {locked && (
                <span className="ml-auto text-[9px] font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 flex-shrink-0">
                  <FiStar className="w-2.5 h-2.5" /> PRO
                </span>
              )}
              
              {active && (
                <motion.div
                  layoutId="active-nav"
                  className="absolute left-0 w-1 h-6 bg-blue-600 rounded-r-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        {/* Usage Stats */}
        <div className="bg-white rounded-xl p-3 mb-3 border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500">Problems this month</span>
            <span className="text-xs font-semibold text-gray-700">
              {used}/{limit === -1 ? '∞' : limit}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="h-full rounded-full"
              style={{ 
                width: `${pct}%`, 
                background: pct > 80 
                  ? 'linear-gradient(90deg, #EF4444, #DC2626)' 
                  : pct > 60
                  ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                  : 'linear-gradient(90deg, #2563EB, #1D4ED8)'
              }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {profile?.plan === 'free' && (
            <Link 
              href="/pricing" 
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-2 transition-colors group"
            >
              Upgrade for unlimited
              <FiChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-sm flex-shrink-0">
            {profile?.username?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate text-gray-900">
              {profile?.username || 'User'}
            </div>
            <div className="text-[11px] text-gray-500 capitalize">
              {profile?.plan || 'free'} plan
            </div>
          </div>
          <button 
            onClick={logout} 
            title="Sign out"
            className="text-gray-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-lg flex-shrink-0"
          >
            <FiLogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2.5 bg-white border border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          whileTap={{ scale: 0.95 }}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? (
            <FiX className="w-5 h-5 text-gray-700" />
          ) : (
            <FiMenu className="w-5 h-5 text-gray-700" />
          )}
        </motion.button>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 flex-shrink-0 shadow-sm">
          {sidebarContent}
        </aside>
      )}

      {/* Mobile Sidebar Overlay & Drawer */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white border-r border-gray-200 flex flex-col z-50 shadow-2xl"
            >
              {/* Mobile Header with Close Button */}
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={() => setMobileOpen(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
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