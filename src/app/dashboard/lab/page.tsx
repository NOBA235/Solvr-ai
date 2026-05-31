//src>app>dashboard>lab>page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const LABS = [
  { id: 'chemistry',   name: 'Chemistry',   icon: '⚗️', color: '#059669', desc: 'Mix reagents, apply heat, discover reactions', count: 18 },
  { id: 'physics',     name: 'Physics',     icon: '⚡', color: '#2563EB', desc: 'Forces, circuits, waves & optics', count: 16 },
  { id: 'mathematics', name: 'Mathematics', icon: '📐', color: '#7C3AED', desc: 'Visualise functions, algebra & geometry', count: 16 },
  { id: 'biology',     name: 'Biology',     icon: '🧬', color: '#EA580C', desc: 'Cells, DNA, enzymes & ecosystems', count: 16 },
]

export default async function LabPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: expCounts } = await supabase
    .from('experiments')
    .select('subject')
    .eq('user_id', user!.id)

  const countBySubject = (expCounts || []).reduce((acc: Record<string, number>, e) => {
    acc[e.subject] = (acc[e.subject] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-extrabold tracking-tight mb-1 text-ink">Virtual Labs</h1>
        <p className="text-sm text-muted font-mono">Interactive simulations for every subject</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {LABS.map(lab => (
          <Link key={lab.id} href={`/dashboard/lab/${lab.id}`}
            className="group bg-white border border-line rounded-2xl p-6 hover:border-muted/30 hover:shadow-lg transition-all hover:-translate-y-1"
            style={{ '--accent': lab.color } as React.CSSProperties}>
            <div className="flex items-start justify-between mb-4">
              <span className="text-3xl">{lab.icon}</span>
              <span className="text-xs font-mono border border-line px-2 py-0.5 rounded-md text-muted bg-paper">
                {countBySubject[lab.id] || 0} runs
              </span>
            </div>
            <h2 className="text-lg font-display font-bold mb-1 text-ink group-hover:text-[var(--accent)] transition-colors">
              {lab.name}
            </h2>
            <p className="text-xs text-muted font-mono mb-4 leading-relaxed">{lab.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted font-mono">{lab.count} items available</span>
              <span className="text-xs font-bold font-mono transition-transform group-hover:translate-x-1" style={{ color: lab.color }}>Enter lab →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}