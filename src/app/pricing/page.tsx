'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PLAN_LIST } from '@/lib/stripe/plans'
import { FiArrowLeft, FiCheck, FiZap, FiStar, FiShield, FiClock, FiBookOpen } from 'react-icons/fi'

export default function PricingPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  const planIcons: Record<string, React.ReactNode> = {
    free: <FiBookOpen className="w-6 h-6" />,
    basic: <FiZap className="w-6 h-6" />,
    pro: <FiStar className="w-6 h-6" />,
  }

  const planColors: Record<string, { color: string; bg: string; border: string; text: string }> = {
    free: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB', text: '#374151' },
    basic: { color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE', text: '#5B21B6' },
    pro: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <FiBookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-gray-900">StudyAI</h1>
              <p className="text-xs text-gray-500">Pricing Plans</p>
            </div>
          </div>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to app
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto relative px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
              Simple, honest pricing
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Start free. Upgrade when you need more. No hidden fees, no surprises.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div 
            className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {(['monthly', 'yearly'] as const).map((b) => (
              <button 
                key={b} 
                onClick={() => setBilling(b)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  billing === b 
                    ? 'bg-primary-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {b === 'yearly' ? '🎉 Yearly (save ~30%)' : 'Monthly'}
              </button>
            ))}
          </motion.div>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {PLAN_LIST.map((plan, i) => {
            const price = plan.price[billing]
            const isHighlight = plan.highlight
            const colors = planColors[plan.id] || planColors.free
            
            return (
              <motion.div 
                key={plan.id}
                className={`relative bg-white rounded-2xl border-2 p-8 flex flex-col transition-shadow hover:shadow-lg ${
                  isHighlight
                    ? 'border-primary-500 shadow-[0_0_40px_rgba(124,58,237,0.1)]'
                    : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 24 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {isHighlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-xs font-bold px-5 py-1.5 rounded-full shadow-sm">
                    MOST POPULAR
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${colors.color}10`, color: colors.color }}
                    >
                      {planIcons[plan.id]}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  </div>
                  
                  <div className="flex items-end gap-1.5 mb-2">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-gray-400 text-sm mb-1.5">
                        /{billing === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>
                  
                  {billing === 'yearly' && price > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      ${Math.round(price / 12)}/mo billed yearly
                    </div>
                  )}
                  
                  {price === 0 && (
                    <p className="text-sm text-gray-500 mt-1">No credit card required</p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 flex-shrink-0">
                        <FiCheck className="w-4 h-4 text-green-500" />
                      </div>
                      <span className="text-sm text-gray-600 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link 
                  href={plan.id === 'free' ? '/auth/register' : `/auth/register?plan=${plan.id}&billing=${billing}`}
                  className={`w-full text-center py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    isHighlight
                      ? 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg'
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  {plan.id === 'free' ? 'Get started free' : `Start ${plan.name}`}
                </Link>
              </motion.div>
            )
          })}
        </div>

        {/* Trust indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: <FiShield className="w-5 h-5" />, title: 'Secure & Private', desc: 'Your data is encrypted and never shared' },
            { icon: <FiClock className="w-5 h-5" />, title: 'Cancel Anytime', desc: 'No long-term contracts or commitments' },
            { icon: <FiZap className="w-5 h-5" />, title: 'Instant Access', desc: 'Start solving problems immediately' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="flex items-start gap-4 p-6 bg-white rounded-xl border border-gray-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500 flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Common questions</h2>
          <div className="space-y-3">
            {[
              { 
                q: 'What counts as a "problem"?', 
                a: 'Each time you submit a problem for solving counts as one use. Viewing past solutions is free and unlimited.' 
              },
              { 
                q: 'Can I cancel anytime?', 
                a: 'Yes, cancel anytime from your account settings. You keep access until the end of your billing period.' 
              },
              { 
                q: 'What subjects are supported?', 
                a: 'Mathematics, Physics, Chemistry, and Biology — from GCSE/high school level up to undergraduate.' 
              },
              { 
                q: 'How accurate are the solutions?', 
                a: "Our AI is highly accurate but can make mistakes. Always verify important answers. We're continuously improving." 
              },
            ].map(({ q, a }, i) => (
              <motion.div 
                key={q} 
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <div className="font-semibold text-gray-900 mb-2 text-sm">{q}</div>
                <div className="text-sm text-gray-600 leading-relaxed">{a}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <p className="text-gray-500 text-sm mb-4">Still have questions?</p>
          <Link 
            href="/contact" 
            className="text-primary-500 hover:text-primary-600 font-medium text-sm underline underline-offset-2"
          >
            Contact our support team
          </Link>
        </div>
      </div>
    </div>
  )
}