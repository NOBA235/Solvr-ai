'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { PLANS, PLAN_LIST } from '@/lib/stripe/plans'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import type { Profile, Subscription } from '@/types'
import { 
  FiSettings, 
  FiCreditCard, 
  FiBarChart2, 
  FiZap, 
  FiStar, 
  FiShield, 
  FiArrowRight,
  FiCheck,
  FiLoader,
  FiBookOpen,
  FiCpu,
  FiTrendingUp
} from 'react-icons/fi'

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
  
  const planConfig: Record<string, { color: string; bg: string; border: string; icon: React.ComponentType<any>; gradient: string }> = {
    free: { 
      color: '#6B7280', 
      bg: '#F9FAFB', 
      border: '#E5E7EB', 
      icon: FiBookOpen,
      gradient: 'from-gray-50 to-gray-100'
    },
    basic: { 
      color: '#7C3AED', 
      bg: '#F3E8FF', 
      border: '#DDD6FE', 
      icon: FiZap,
      gradient: 'from-purple-50 to-purple-100'
    },
    premium: { 
      color: '#059669', 
      bg: '#ECFDF5', 
      border: '#A7F3D0', 
      icon: FiStar,
      gradient: 'from-emerald-50 to-emerald-100'
    },
  }

  const plan = planConfig[profile?.plan || 'free']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <FiSettings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your account and subscription</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Plan */}
            <motion.section 
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                <h2 className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                  Current Plan
                </h2>
              </div>

              <div className={`bg-gradient-to-br ${plan.gradient} rounded-xl p-5 sm:p-6 border`} style={{ borderColor: plan.border }}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: plan.bg, color: plan.color }}
                    >
                      <plan.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                        {currentPlan.name} Plan
                      </h3>
                      <p className="text-sm text-gray-600">
                        {currentPlan.price.monthly === 0
                          ? 'Free forever — no credit card required'
                          : `$${currentPlan.price.monthly}/month · $${currentPlan.price.yearly}/year`}
                      </p>
                      {sub?.current_period_end && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`w-2 h-2 rounded-full ${sub.cancel_at_period_end ? 'bg-red-400' : 'bg-green-400'}`} />
                          <span className="text-xs text-gray-500">
                            {sub.cancel_at_period_end ? 'Cancels on' : 'Renews on'}{' '}
                            {new Date(sub.current_period_end).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {profile?.plan !== 'free' && (
                    <button 
                      onClick={handlePortal} 
                      disabled={loadingPortal}
                      className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {loadingPortal ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <FiCreditCard className="w-4 h-4" />
                          Manage billing
                          <FiArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Usage Stats */}
            <motion.section 
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                <h2 className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                  Usage This Month
                </h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { 
                    label: 'Problems Solved', 
                    val: profile?.problems_used ?? 0, 
                    limit: currentPlan.limits.problemsPerMonth,
                    icon: FiBarChart2,
                    color: '#7C3AED',
                    bg: '#F3E8FF'
                  },
                  { 
                    label: 'Lab Experiments', 
                    val: profile?.experiments_run ?? 0, 
                    limit: -1,
                    icon: FiCpu,
                    color: '#059669',
                    bg: '#ECFDF5'
                  },
                ].map(({ label, val, limit, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-5 border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3 mb-4">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: bg, color: color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{label}</div>
                        <div className="text-xs text-gray-500">
                          {limit === -1 ? 'Unlimited' : `${limit} per month`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-gray-900">{val}</span>
                      <span className="text-sm text-gray-400 mb-1">
                        / {limit === -1 ? '∞' : limit}
                      </span>
                    </div>

                    {limit > 0 && (
                      <div className="space-y-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${Math.min(100, (val / limit) * 100)}%`,
                              backgroundColor: color 
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (val / limit) * 100)}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{Math.round((val / limit) * 100)}% used</span>
                          <span>{limit - val} remaining</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Upgrade Plans */}
            {profile?.plan !== 'premium' && (
              <motion.section 
                className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                    <h2 className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                      Upgrade Plan
                    </h2>
                  </div>
                  
                  {/* Billing toggle */}
                  <div className="inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start">
                    {(['monthly', 'yearly'] as const).map(b => (
                      <button 
                        key={b} 
                        onClick={() => setBilling(b)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                          billing === b 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {b === 'yearly' ? '🎉 Yearly (−30%)' : 'Monthly'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {PLAN_LIST.filter(p => p.id !== 'free' && p.id !== profile?.plan).map((planItem, i) => {
                    const isHighlighted = planItem.highlight
                    const planId = planItem.id as keyof typeof planConfig
                    const planColors = planConfig[planId] || planConfig.free
                    
                    return (
                      <motion.div 
                        key={planItem.id}
                        className={`relative rounded-xl p-5 sm:p-6 border-2 transition-all ${
                          isHighlighted 
                            ? 'border-primary-400 shadow-lg shadow-primary-100/50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        {isHighlighted && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                            BEST VALUE
                          </div>
                        )}

                        <div className="flex items-center gap-3 mb-4">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: planColors.bg, color: planColors.color }}
                          >
                            <planColors.icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900">{planItem.name}</h3>
                        </div>

                        <div className="mb-4">
                          <div className="flex items-end gap-1.5">
                            <span className="text-3xl font-extrabold text-gray-900">
                              ${planItem.price[billing]}
                            </span>
                            <span className="text-sm text-gray-400 mb-1">
                              /{billing === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          {billing === 'yearly' && (
                            <p className="text-xs text-green-600 font-medium mt-1">
                              ${Math.round(planItem.price.yearly / 12)}/mo billed annually
                            </p>
                          )}
                        </div>

                        <ul className="space-y-2 mb-6">
                          {planItem.features.map(f => (
                            <li key={f} className="flex items-start gap-2 text-sm">
                              <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600">{f}</span>
                            </li>
                          ))}
                        </ul>

                        <button 
                          onClick={() => handleUpgrade(planItem.id)} 
                          disabled={loadingUpgrade === planItem.id}
                          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                            isHighlighted 
                              ? 'bg-primary-500 text-white hover:bg-primary-600 shadow-sm hover:shadow-md' 
                              : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                        >
                          {loadingUpgrade === planItem.id ? (
                            <>
                              <FiLoader className="w-4 h-4 animate-spin" />
                              Redirecting...
                            </>
                          ) : (
                            <>
                              Upgrade to {planItem.name}
                              <FiArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.section>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <motion.div 
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FiTrendingUp className="w-5 h-5 text-[#8b7355]" />
                <h3 className="font-semibold text-gray-900 text-sm">Account Overview</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Plan Status</div>
                  <div 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ backgroundColor: plan.bg, color: plan.color }}
                  >
                    <plan.icon className="w-4 h-4" />
                    {currentPlan.name}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Total Problems</div>
                  <div className="text-lg font-bold text-gray-900">
                    {profile?.problems_used ?? 0}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">Experiments Run</div>
                  <div className="text-lg font-bold text-gray-900">
                    {profile?.experiments_run ?? 0}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features comparison */}
            <motion.div 
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <FiShield className="w-5 h-5 text-[#8b7355]" />
                <h3 className="font-semibold text-gray-900 text-sm">All Plans Include</h3>
              </div>
              
              <ul className="space-y-3">
                {[
                  'Step-by-step solutions',
                  'Multiple subjects supported',
                  'Save & bookmark problems',
                  'Export solutions',
                  '24/7 access',
                ].map(feature => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}