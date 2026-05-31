import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import { timeAgo, SUBJECT_CONFIG } from '@/lib/utils'
import SoVLogo from '@/components/SoVLogo'
import SolvePage from '@/app/dashboard/solve/page'

// Production SVG Icons Component
const Icons = {
  Lab: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6v4l4 10H5L9 7V3z"/>
      <path d="M9 12h6"/>
      <path d="M12 9v6"/>
    </svg>
  ),
  History: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Upgrade: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Empty: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M8 15s1.5-2 4-2 4 2 4 2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  Warning: ({ className = "w-6 h-6" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  ArrowRight: ({ className = "w-4 h-4" }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/>
      <polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: profile }, { data: recentProblems }, { data: recentExps }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('problems').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('experiments').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(3),
  ])

  const plan = PLANS[profile?.plan || 'free']
  const limit = plan.limits.problemsPerMonth
  const used = profile?.problems_used || 0
  const pct = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100))

  const QUICK_ACTIONS = [
    { 
      href: '/dashboard/lab', 
      icon: Icons.Lab, 
      label: 'Virtual Lab', 
      desc: 'Interactive chemistry & physics', 
      locked: profile?.plan === 'free',
      badge: profile?.plan === 'free' ? 'PRO' : null
    },
    { 
      href: '/dashboard/history', 
      icon: Icons.History, 
      label: 'My Solutions', 
      desc: 'Browse your solved problems'
    },
    { 
      href: '/pricing', 
      icon: Icons.Upgrade, 
      label: 'Upgrade Plan', 
      desc: 'Unlock unlimited problems', 
      hide: profile?.plan === 'premium',
      accent: true
    },
  ].filter(a => !a.hide)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Main Solve Component - Full width at top */}
      <div className="border-b border-gray-200 shadow-sm">
        <SolvePage />
      </div>

      {/* Dashboard Content - Below the solver */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Usage Card - Enhanced mobile design */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Current Plan
              </div>
              <div className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {plan.name}
              </div>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                plan.id === 'free' 
                  ? 'bg-gray-100 text-gray-700' 
                  : plan.id === 'basic'
                  ? 'bg-blue-50 text-blue-700'
                  : 'bg-green-50 text-green-700'
              }`}>
                {plan.id === 'free' ? 'Free tier' : plan.id === 'basic' ? 'Basic plan' : 'Premium plan'}
              </span>
            </div>
            
            <div className="sm:text-right">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Problems This Month
              </div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                {used}
                <span className="text-gray-400 font-normal text-base ml-1">
                  / {limit === -1 ? '∞' : limit}
                </span>
              </div>
            </div>
          </div>
          
          {limit !== -1 && (
            <div className="space-y-3">
              <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ 
                    width: `${pct}%`, 
                    background: pct > 80 
                      ? 'linear-gradient(90deg, #EF4444, #DC2626)' 
                      : pct > 60 
                      ? 'linear-gradient(90deg, #F59E0B, #D97706)'
                      : 'linear-gradient(90deg, #2563EB, #1D4ED8)'
                  }} 
                />
              </div>
              {pct >= 80 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Icons.Warning className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-amber-800">
                      You're running low on problems this month
                    </p>
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 underline mt-1"
                    >
                      Upgrade for unlimited access
                      <Icons.ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 px-1">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {QUICK_ACTIONS.map(({ href, icon: Icon, label, desc, locked, badge, accent }) => (
              <Link 
                key={href} 
                href={href}
                className={`group relative bg-white border rounded-xl sm:rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:shadow-lg ${
                  accent
                    ? 'border-amber-200 hover:border-amber-300 bg-gradient-to-br from-amber-50 to-white'
                    : locked
                    ? 'border-gray-200 opacity-75 hover:opacity-85'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {badge && (
                  <div className="absolute top-3 right-3 text-xs font-semibold bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                    {badge}
                  </div>
                )}
                
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-3 sm:mb-4 ${
                  accent
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                }`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                
                <h3 className={`text-sm sm:text-base font-semibold mb-1 ${
                  accent ? 'text-amber-900' : 'text-gray-900'
                }`}>
                  {label}
                </h3>
                
                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                  {desc}
                </p>
                
                <div className={`inline-flex items-center gap-1 text-xs font-medium mt-3 ${
                  accent ? 'text-amber-600' : 'text-gray-500'
                }`}>
                  {locked ? 'Upgrade to access' : 'Get started'}
                  <Icons.ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity - Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Recent Problems */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Recent Problems</h2>
              {(recentProblems?.length ?? 0) > 0 && (
                <Link 
                  href="/dashboard/history" 
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  View all
                  <Icons.ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {(recentProblems?.length ?? 0) === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icons.Empty className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No problems yet</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Start solving problems above and track your progress here
                  </p>
                </div>
              )}
              
              {recentProblems?.map((p) => {
                const subj = SUBJECT_CONFIG[p.subject as keyof typeof SUBJECT_CONFIG]
                return (
                  <div
                    key={p.id}
                    className="group bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: subj?.color ? `${subj.color}15` : '#F3F4F6' }}
                      >
                        <span className="text-lg">{subj?.icon || '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {p.topic || 'Unnamed problem'}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span 
                            className="text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: subj?.color ? `${subj.color}15` : '#F3F4F6',
                              color: subj?.color || '#6B7280'
                            }}
                          >
                            {p.subject}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{p.difficulty || 'unknown'}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{timeAgo(p.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lab Experiments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Lab Experiments</h2>
              {(recentExps?.length ?? 0) > 0 && (
                <Link 
                  href="/dashboard/lab" 
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open lab
                  <Icons.ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              {(recentExps?.length ?? 0) === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                    <Icons.Lab className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {profile?.plan === 'free' ? 'Virtual labs available' : 'No experiments yet'}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {profile?.plan === 'free' 
                      ? 'Upgrade to access interactive virtual labs' 
                      : 'Start exploring chemistry and physics experiments'
                    }
                  </p>
                  {profile?.plan === 'free' ? (
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Upgrade to access
                      <Icons.ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link 
                      href="/dashboard/lab" 
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Start experimenting
                      <Icons.ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
              
              {recentExps?.map((e) => (
                <div
                  key={e.id}
                  className="group bg-white border border-gray-200 rounded-xl p-3 sm:p-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <Icons.Lab className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {e.inputs?.join(' + ')} → {e.action}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                          {e.subject}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">{timeAgo(e.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile bottom spacing */}
        <div className="h-6 lg:hidden" />
      </div>
    </div>
  )
}