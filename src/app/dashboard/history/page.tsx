'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, SUBJECT_CONFIG } from '@/lib/utils'
import type { Problem, Subject } from '@/types'
import MathRenderer from '@/components/MathRenderer'

export default function HistoryPage() {
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Problem | null>(null)
  const [filter, setFilter]     = useState<Subject | 'all'>('all')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('problems')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200)
        .then(({ data }) => {
          setProblems(data || [])
          setLoading(false)
        })
    })
  }, [])

  const toggleBookmark = async (id: string, current: boolean) => {
    const supabase = createClient()
    await supabase.from('problems').update({ is_bookmarked: !current }).eq('id', id)
    setProblems(p => p.map(x => x.id === id ? { ...x, is_bookmarked: !current } : x))
  }

  const displayed = problems.filter(p => {
    if (filter !== 'all' && p.subject !== filter) return false
    if (search && !p.topic?.toLowerCase().includes(search.toLowerCase()) &&
        !p.input_text?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const subjects: (Subject | 'all')[] = ['all', 'mathematics', 'physics', 'chemistry', 'biology']

  return (
    <div className="flex h-full overflow-hidden bg-paper">
      {/* List */}
      <div className="w-80 flex-shrink-0 border-r border-line flex flex-col bg-white overflow-hidden">
        <div className="p-4 border-b border-line">
          <h1 className="text-base font-display font-extrabold mb-3 text-ink">Problem History</h1>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search topics..."
            className="w-full bg-paper border border-line rounded-lg px-3 py-2 text-xs font-mono text-ink placeholder-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 mb-3" />
          <div className="flex flex-wrap gap-1">
            {subjects.map(s => {
              const cfg = s !== 'all' ? SUBJECT_CONFIG[s] : null
              return (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-2 py-1 rounded text-[10px] font-mono border transition-all ${
                    filter === s 
                      ? 'bg-primary/5 border-primary/30 text-ink font-semibold' 
                      : 'border-line text-muted hover:text-ink hover:border-muted/50'
                  }`}>
                  {cfg ? `${cfg.icon} ${s}` : 'All'}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading && <div className="p-4 text-xs text-muted font-mono text-center">Loading...</div>}
          {!loading && displayed.length === 0 && (
            <div className="p-6 text-center">
              <div className="text-2xl mb-2 opacity-20">📭</div>
              <div className="text-xs text-muted font-mono">No problems found</div>
            </div>
          )}
          {displayed.map(p => {
            const cfg = SUBJECT_CONFIG[p.subject]
            const isActive = selected?.id === p.id
            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  isActive 
                    ? 'border-primary/30 bg-primary/5 shadow-sm' 
                    : 'border-line hover:border-muted/30 hover:bg-paper/50'
                }`}>
                <div className="flex items-start gap-2.5">
                  <span className="text-base mt-0.5">{cfg?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate text-ink">{p.topic || 'Untitled'}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-medium" style={{ color: cfg?.color || '#2563EB' }}>{p.subject}</span>
                      {p.difficulty && <>
                        <span className="text-muted/30">·</span>
                        <span className="text-[10px] font-mono text-muted">{p.difficulty}</span>
                      </>}
                      <span className="text-muted/30">·</span>
                      <span className="text-[10px] font-mono text-muted">{timeAgo(p.created_at)}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleBookmark(p.id, p.is_bookmarked) }}
                    className={`text-sm flex-shrink-0 transition-colors ${p.is_bookmarked ? 'text-warn' : 'text-muted/30 hover:text-warn/70'}`}>
                    {p.is_bookmarked ? '★' : '☆'}
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Solution viewer */}
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        {!selected && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3 opacity-20">📋</div>
            <div className="text-base font-display font-bold text-muted">Select a problem to view</div>
            <div className="text-xs text-muted/50 font-mono mt-1">Your solution will appear here</div>
          </div>
        )}
        {selected && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink">{selected.topic || 'Solution'}</h2>
                <div className="text-xs text-muted font-mono mt-0.5">
                  {selected.subject} · {selected.difficulty} · {timeAgo(selected.created_at)}
                  {selected.processing_time_ms && ` · ${selected.processing_time_ms}ms`}
                </div>
              </div>
            </div>

            {selected.input_text && (
              <div className="bg-paper border border-line rounded-xl p-4 mb-6">
                <div className="text-[10px] font-mono text-muted mb-2 tracking-wider">ORIGINAL PROBLEM</div>
                <p className="text-sm text-ink/80 font-mono leading-relaxed">{selected.input_text}</p>
              </div>
            )}

            {selected.key_formulas && selected.key_formulas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selected.key_formulas.map(f => (
                  <span key={f} className="text-xs font-mono bg-white border border-line px-2.5 py-1 rounded-lg text-ink/60">{f}</span>
                ))}
              </div>
            )}

            {selected.solution_markdown && (
              <div className="bg-white border border-line rounded-xl p-6">
                <MathRenderer>
                  {selected.solution_markdown}
                </MathRenderer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}