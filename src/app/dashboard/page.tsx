
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/stripe/plans'
import { timeAgo, SUBJECT_CONFIG } from '@/lib/utils'
import SoVLogo from '@/components/SoVLogo';

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
    { href: '/dashboard/solve', icon: '🔬', label: 'Solve a Problem', desc: 'Upload or type any STEM problem' },
    { href: '/dashboard/lab', icon: '⚗️', label: 'Virtual Lab', desc: 'Interactive chemistry & physics', locked: profile?.plan === 'free' },
    { href: '/dashboard/history', icon: '📋', label: 'My Solutions', desc: 'Browse your solved problems' },
    { href: '/pricing', icon: '⚡', label: 'Upgrade Plan', desc: 'Unlock unlimited problems', hide: profile?.plan === 'premium' },
  ].filter(a => !a.hide)

  return (
    <div className="min-h-screen bg-paper">
      <div className="p-3 xs:p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}       
  <SoVLogo className="h-7 w-7 sm:h-8 sm:w-8" />
  <span className="text-base sm:text-lg text-center font-extrabold tracking-tight text-primary">
    Solvr AI
  </span>
 <h1 className='bg-gray text-black font-bold text-[30px]'>Free AI Solver</h1> 
 <p className='text-black font-[24px]'>Get instant, easy-to-follow solutions for Stem subjects.</p>           
   
        {/* Usage card */}
        <div className="bg-white border border-line rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-6 mb-4 xs:mb-6 sm:mb-8">
          <div className="flex flex-col xs:flex-row items-start justify-between gap-3 xs:gap-4 sm:gap-6 mb-3 xs:mb-4">
            <div className="w-full xs:w-auto">
              <div className="text-[10px] xs:text-xs font-mono text-muted mb-0.5 sm:mb-1">CURRENT PLAN</div>
              <div className="text-base xs:text-lg sm:text-xl font-bold text-ink">
                {plan.name}
              </div>
              <span className={`inline-block mt-1 text-[10px] xs:text-xs font-mono px-2 py-0.5 rounded ${
                plan.id === 'free' 
                  ? 'text-muted bg-line/30' 
                  : plan.id === 'basic'
                  ? 'text-primary bg-primary/5'
                  : 'text-green-700 bg-green-50'
              }`}>
                {plan.id === 'free' ? 'Free tier' : plan.id === 'basic' ? 'Basic plan' : 'Premium plan'}
              </span>
            </div>
            <div className="w-full xs:w-auto xs:text-right">
              <div className="text-[10px] xs:text-xs font-mono text-muted mb-0.5 sm:mb-1">PROBLEMS THIS MONTH</div>
              <div className="text-base xs:text-lg sm:text-xl font-bold text-ink">
                {used} <span className="text-muted text-sm font-mono">/ {limit === -1 ? '∞' : limit}</span>
              </div>
            </div>
          </div>
          
          {limit !== -1 && (
            <div>
              <div className="w-full bg-line rounded-full h-1.5 xs:h-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300" 
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: pct > 80 ? '#DC2626' : pct > 60 ? '#F59E0B' : '#2563EB'
                  }} 
                />
              </div>
              {pct >= 80 && (
                <div className="flex items-start gap-2 mt-2 xs:mt-3 p-2 xs:p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-600 mt-0.5 text-sm xs:text-base">⚠️</span>
                  <p className="text-[10px] xs:text-xs sm:text-sm text-amber-700 font-mono">
                    Running low on problems.{' '}
                    <Link href="/pricing" className="underline font-semibold hover:text-amber-800">
                      Upgrade for more →
                    </Link>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-6 xs:mb-8 sm:mb-10">
          {QUICK_ACTIONS.map(({ href, icon, label, desc, locked }) => (
            <Link 
              key={href} 
              href={href}
              className={`relative bg-white border border-line rounded-lg xs:rounded-xl p-3 xs:p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all group ${
                locked ? 'opacity-60 hover:opacity-70' : ''
              }`}
            >
              <div className="text-lg xs:text-xl sm:text-2xl lg:text-3xl mb-1 xs:mb-2 sm:mb-3">{icon}</div>
              <div className="text-[11px] xs:text-xs sm:text-sm font-semibold mb-0.5 xs:mb-1 group-hover:text-primary transition-colors text-ink leading-tight">
                {label}
              </div>
              <div className="text-[9px] xs:text-[10px] sm:text-xs text-muted font-mono leading-tight hidden xs:block">
                {desc}
              </div>
              {locked && (
                <div className="absolute top-2 right-2 text-[9px] xs:text-[10px] bg-amber-50 text-amber-700 font-mono px-1.5 xs:px-2 py-0.5 rounded border border-amber-200">
                  PRO
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Recent problems & experiments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 xs:gap-6 lg:gap-8">
          {/* Recent Problems */}
          <div>
            <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
              <h2 className="text-sm xs:text-base sm:text-lg font-display font-bold text-ink">Recent Problems</h2>
              <Link 
                href="/dashboard/history" 
                className="text-[10px] xs:text-xs sm:text-sm text-primary font-mono hover:underline transition-colors"
              >
                View all →
              </Link>
            </div>
            
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
              {!recentProblems?.length && (
                <div className="bg-white border border-line rounded-lg xs:rounded-xl p-4 xs:p-6 sm:p-8 text-center">
                  <div className="text-2xl xs:text-3xl mb-2 xs:mb-3 opacity-30">📭</div>
                  <p className="text-xs sm:text-sm text-muted font-mono mb-3 xs:mb-4">No problems yet</p>
                  <Link 
                    href="/dashboard/solve" 
                    className="inline-flex items-center gap-1.5 xs:gap-2 text-xs sm:text-sm text-primary font-mono hover:underline"
                  >
                    Solve your first problem →
                  </Link>
                </div>
              )}
              
              {recentProblems?.map((p) => {
                const subj = SUBJECT_CONFIG[p.subject as keyof typeof SUBJECT_CONFIG]
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-line rounded-lg xs:rounded-xl p-2.5 xs:p-3 sm:p-4 hover:border-primary/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-2 xs:gap-3">
                      <span className="text-lg xs:text-xl sm:text-2xl mt-0.5 flex-shrink-0">{subj?.icon || '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] xs:text-xs sm:text-sm font-semibold mb-0.5 xs:mb-1 truncate text-ink">
                          {p.topic || 'Unnamed problem'}
                        </div>
                        <div className="text-[9px] xs:text-[10px] sm:text-xs text-muted font-mono flex flex-wrap items-center gap-1 xs:gap-1.5">
                          <span style={{ color: subj?.color || '#6B7280' }}>
                            {p.subject}
                          </span>
                          <span className="text-line">·</span>
                          <span>{p.difficulty || 'unknown'}</span>
                          <span className="text-line">·</span>
                          <span>{timeAgo(p.created_at)}</span>
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
            <div className="flex items-center justify-between mb-2 xs:mb-3 sm:mb-4">
              <h2 className="text-sm xs:text-base sm:text-lg font-display font-bold text-ink">Lab Experiments</h2>
              <Link 
                href="/dashboard/lab" 
                className="text-[10px] xs:text-xs sm:text-sm text-primary font-mono hover:underline transition-colors"
              >
                Open lab →
              </Link>
            </div>
            
            <div className="space-y-1.5 xs:space-y-2 sm:space-y-3">
              {!recentExps?.length && (
                <div className="bg-white border border-line rounded-lg xs:rounded-xl p-4 xs:p-6 sm:p-8 text-center">
                  <div className="text-2xl xs:text-3xl mb-2 xs:mb-3 opacity-30">⚗️</div>
                  <p className="text-xs sm:text-sm text-muted font-mono mb-3 xs:mb-4">No lab experiments yet</p>
                  {profile?.plan === 'free' ? (
                    <Link 
                      href="/pricing" 
                      className="inline-flex items-center gap-1.5 xs:gap-2 text-xs sm:text-sm text-primary font-mono hover:underline"
                    >
                      Upgrade to access virtual labs →
                    </Link>
                  ) : (
                    <Link 
                      href="/dashboard/lab" 
                      className="inline-flex items-center gap-1.5 xs:gap-2 text-xs sm:text-sm text-primary font-mono hover:underline"
                    >
                      Start experimenting →
                    </Link>
                  )}
                </div>
              )}
              
              {recentExps?.map((e) => (
                <div
                  key={e.id}
                  className="bg-white border border-line rounded-lg xs:rounded-xl p-2.5 xs:p-3 sm:p-4 hover:border-primary/20 hover:shadow-sm transition-all"
                >
                  <div className="text-[11px] xs:text-xs sm:text-sm font-semibold mb-0.5 xs:mb-1 text-ink">
                    {e.inputs?.join(' + ')} → {e.action}
                  </div>
                  <div className="text-[9px] xs:text-[10px] sm:text-xs text-muted font-mono flex items-center gap-1 xs:gap-1.5">
                    <span>{e.subject}</span>
                    <span className="text-line">·</span>
                    <span>{timeAgo(e.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom padding for mobile */}
        <div className="h-6 xs:h-8 lg:hidden" />
      </div>
    </div>
  )
}