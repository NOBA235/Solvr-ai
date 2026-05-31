'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLANS, PLAN_LIST } from '@/lib/stripe/plans'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Subscription } from '@/types'

export default function SettingsClient() {
  const params = useSearchParams()
  const [profile, setProfile]        = useState<Profile | null>(null)
  const [sub, setSub]                = useState<Subscription | null>(null)
  const [billing, setBilling]        = useState<'monthly' | 'yearly'>('monthly')
  const [loadingPortal, setPortal]   = useState(false)
  const [loadingUpgrade, setUpgrade] = useState<string | null>(null)

  useEffect(() => {
    if (params.get('checkout') === 'success') toast.success('🎉 Subscription activated!')
  }, [params])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
      ]).then(([{ data: p }, { data: s }]) => { setProfile(p); setSub(s) })
    })
  }, [])

  const handleUpgrade = async (planId: string) => {
    setUpgrade(planId)
    try {
      const res = await fetch('/api/subscriptions/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, billing }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      if (data.url) window.location.href = data.url
    } catch { toast.error('Failed to start checkout') }
    finally { setUpgrade(null) }
  }

  const handlePortal = async () => {
    setPortal(true)
    try {
      const res = await fetch('/api/subscriptions/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { toast.error(error); return }
      window.location.href = url
    } catch { toast.error('Failed to open billing portal') }
    finally { setPortal(false) }
  }

  const currentPlan = PLANS[profile?.plan || 'free']
  const planColor = profile?.plan === 'free' ? '#6B7280' : profile?.plan === 'basic' ? '#7C3AED' : '#059669'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight mb-1 text-ink">Settings</h1>
      <p className="text-xs sm:text-sm text-muted font-mono mb-6 sm:mb-8">Manage your account and subscription</p>

      {/* Current plan */}
      <section className="bg-white border border-line rounded-2xl p-5 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-[10px] sm:text-[11px] font-bold text-muted mb-4 font-mono tracking-widest uppercase">Current Plan</h2>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-xl sm:text-2xl font-display font-extrabold mb-0.5" style={{ color: planColor }}>
              {currentPlan.name}
            </div>
            <div className="text-sm text-muted font-mono">
              {currentPlan.price.monthly === 0
                ? 'Free forever'
                : `$${currentPlan.price.monthly}/mo · $${currentPlan.price.yearly}/yr`}
            </div>
            {sub?.current_period_end && (
              <div className="text-xs text-muted font-mono mt-1">
                {sub.cancel_at_period_end ? 'Cancels' : 'Renews'}: {new Date(sub.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
          {profile?.plan !== 'free' && (
            <button onClick={handlePortal} disabled={loadingPortal}
              className="bg-paper border border-line text-ink/70 font-mono text-xs px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl hover:border-muted/50 hover:bg-white transition-all disabled:opacity-50">
              {loadingPortal ? 'Opening...' : 'Manage billing →'}
            </button>
          )}
        </div>
      </section>

      {/* Usage */}
      <section className="bg-white border border-line rounded-2xl p-5 sm:p-6 mb-4 sm:mb-6">
        <h2 className="text-[10px] sm:text-[11px] font-bold text-muted mb-4 font-mono tracking-widest uppercase">Usage This Month</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: 'Problems Solved', val: profile?.problems_used ?? 0, limit: currentPlan.limits.problemsPerMonth },
            { label: 'Lab Experiments', val: profile?.experiments_run ?? 0, limit: -1 },
          ].map(({ label, val, limit }) => (
            <div key={label} className="bg-paper rounded-xl p-4">
              <div className="text-xs font-mono text-muted mb-1">{label}</div>
              <div className="text-xl font-bold text-ink mb-2">
                {val} <span className="text-sm text-muted font-mono">/ {limit === -1 ? '∞' : limit}</span>
              </div>
              {limit > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, (val / limit) * 100)}%`, background: planColor }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Upgrade */}
      {profile?.plan !== 'premium' && (
        <section className="bg-white border border-line rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-[10px] sm:text-[11px] font-bold text-muted font-mono tracking-widest uppercase">Upgrade Plan</h2>
            <div className="flex gap-1 bg-paper border border-line rounded-lg p-0.5 self-start">
              {(['monthly', 'yearly'] as const).map(b => (
                <button key={b} onClick={() => setBilling(b)}
                  className={`px-3 sm:px-4 py-1.5 rounded-md font-mono text-xs transition-all ${
                    billing === b 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-muted hover:text-ink'
                  }`}>
                  {b === 'yearly' ? 'Yearly −30%' : 'Monthly'}
                </button>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {PLAN_LIST.filter(p => p.id !== 'free' && p.id !== profile?.plan).map(plan => (
              <motion.div key={plan.id}
                className={`border rounded-xl p-4 sm:p-5 transition-colors ${
                  plan.highlight 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-line hover:border-muted/30'
                }`}
                whileHover={{ scale: 1.01 }}>
                <div className="text-base font-display font-bold mb-0.5 text-ink">{plan.name}</div>
                <div className="text-2xl font-display font-extrabold mb-3 text-ink">
                  ${plan.price[billing]}
                  <span className="text-sm text-muted font-mono">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {plan.features.map(f => (
                    <li key={f} className="text-xs text-ink/60 font-mono flex gap-2">
                      <span className="text-green-600">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => handleUpgrade(plan.id)} disabled={loadingUpgrade === plan.id}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 ${
                    plan.highlight 
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : 'bg-paper border border-line text-ink/70 hover:bg-white hover:border-muted/30'
                  }`}>
                  {loadingUpgrade === plan.id ? 'Redirecting...' : `Upgrade to ${plan.name} →`}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}