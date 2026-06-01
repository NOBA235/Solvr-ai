'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { timeAgo, SUBJECT_CONFIG } from '@/lib/utils'
import type { Problem, Subject } from '@/types'
import MathRenderer from '@/components/MathRenderer'
import { 
  FiSearch, 
  FiBookmark, 
  FiClock, 
  FiBarChart2, 
  FiFileText,
  FiChevronRight,
  FiFilter,
  FiBookOpen,
  FiStar
} from 'react-icons/fi'
import { 
  TbMath, 
  TbAtom, 
  TbFlask, 
  TbDna 
} from 'react-icons/tb'

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

  const subjectIcons: Record<string, React.ComponentType<any>> = {
    mathematics: TbMath,
    physics: TbAtom,
    chemistry: TbFlask,
    biology: TbDna,
  }

  const subjectColors: Record<string, { color: string; bg: string; border: string; text: string }> = {
    mathematics: { color: '#7C3AED', bg: '#F3E8FF', border: '#DDD6FE', text: '#5B21B6' },
    physics: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF' },
    chemistry: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' },
    biology: { color: '#EA580C', bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412' },
  }

  const difficultyColors: Record<string, { color: string; bg: string }> = {
    easy: { color: '#059669', bg: '#ECFDF5' },
    medium: { color: '#D97706', bg: '#FFFBEB' },
    hard: { color: '#EA580C', bg: '#FFF7ED' },
  }

  return (
    <div className="flex h-full overflow-hidden bg-gradient-to-br from-gray-50 to-white">
      {/* Sidebar List */}
      <div className="w-80 lg:w-96 flex-shrink-0 border-r border-gray-200 flex flex-col bg-white overflow-hidden">
        {/* Header */}
        <div className="p-4 lg:p-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <FiBookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">Problem History</h1>
              <p className="text-xs text-gray-500">{problems.length} problems solved</p>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search topics or questions..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          {/* Subject filters */}
          <div className="flex flex-wrap gap-1.5">
            {subjects.map(s => {
              const cfg = s !== 'all' ? SUBJECT_CONFIG[s] : null
              const colors = s !== 'all' ? subjectColors[s] : null
              const isActive = filter === s
              
              return (
                <button 
                  key={s} 
                  onClick={() => setFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-primary-50 border border-primary-200 text-primary-700 shadow-sm' 
                      : 'border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 bg-white'
                  }`}
                  style={isActive && colors ? { 
                    backgroundColor: colors.bg, 
                    borderColor: colors.border, 
                    color: colors.color 
                  } : {}}
                >
                  {cfg ? <span>{cfg.icon}</span> : <FiFilter className="w-3 h-3" />}
                  {cfg ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
                </button>
              )
            })}
          </div>
        </div>

        {/* Problem list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-500 rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading history...</p>
            </div>
          )}
          
          {!loading && displayed.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <FiFileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500">No problems found</p>
              <p className="text-xs text-gray-400 mt-1">
                {search || filter !== 'all' ? 'Try adjusting your filters' : 'Start solving to build your history'}
              </p>
            </div>
          )}
          
          {displayed.map(p => {
            const cfg = SUBJECT_CONFIG[p.subject]
            const isActive = selected?.id === p.id
            const colors = subjectColors[p.subject] || subjectColors.mathematics
            
            return (
              <button 
                key={p.id} 
                onClick={() => setSelected(p)}
                className={`w-full text-left p-3 rounded-xl border transition-all group ${
                  isActive 
                    ? 'border-primary-300 bg-primary-50/50 shadow-sm' 
                    : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Subject icon */}
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: colors.bg, color: colors.color }}
                  >
                    <span className="text-base">{cfg?.icon}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate mb-1">
                      {p.topic || 'Untitled Problem'}
                    </div>
                    
                    {p.input_text && (
                      <p className="text-xs text-gray-500 truncate mb-2 line-clamp-1">
                        {p.input_text}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Subject badge */}
                      <span 
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {p.subject}
                      </span>
                      
                      {/* Difficulty badge */}
                      {p.difficulty && difficultyColors[p.difficulty] && (
                        <span 
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: difficultyColors[p.difficulty].bg, 
                            color: difficultyColors[p.difficulty].color 
                          }}
                        >
                          {p.difficulty}
                        </span>
                      )}
                      
                      {/* Time */}
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <FiClock className="w-2.5 h-2.5" />
                        {timeAgo(p.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Bookmark button */}
                  <button 
                    onClick={e => { e.stopPropagation(); toggleBookmark(p.id, p.is_bookmarked) }}
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                      p.is_bookmarked 
                        ? 'text-amber-500 hover:text-amber-600 bg-amber-50' 
                        : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100 opacity-0 group-hover:opacity-100'
                    }`}
                    title={p.is_bookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <FiStar className={`w-4 h-4 ${p.is_bookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Solution viewer */}
      <div className="flex-1 overflow-y-auto bg-[#faf8f3]">
        {!selected && (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiFileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a problem</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              Click on any problem from the list to view its detailed solution
            </p>
          </div>
        )}
        
        {selected && (
          <div className="max-w-4xl mx-auto p-6 lg:p-10">
            {/* Problem header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                    {selected.topic || 'Solution'}
                  </h2>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Subject badge */}
                    {selected.subject && subjectColors[selected.subject] && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{ 
                          backgroundColor: subjectColors[selected.subject].bg, 
                          color: subjectColors[selected.subject].color 
                        }}
                      >
                        <span>{SUBJECT_CONFIG[selected.subject]?.icon}</span>
                        {selected.subject}
                      </span>
                    )}
                    
                    {/* Difficulty badge */}
                    {selected.difficulty && difficultyColors[selected.difficulty] && (
                      <span 
                        className="text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5"
                        style={{ 
                          backgroundColor: difficultyColors[selected.difficulty].bg, 
                          color: difficultyColors[selected.difficulty].color 
                        }}
                      >
                        <FiBarChart2 className="w-3 h-3" />
                        {selected.difficulty}
                      </span>
                    )}
                    
                    {/* Time */}
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <FiClock className="w-3 h-3" />
                      {timeAgo(selected.created_at)}
                    </span>
                    
                    {/* Processing time */}
                    {selected.processing_time_ms && (
                      <span className="text-xs text-gray-400">
                        · Solved in {(selected.processing_time_ms / 1000).toFixed(1)}s
                      </span>
                    )}
                    
                    {/* Bookmark */}
                    <button 
                      onClick={() => toggleBookmark(selected.id, selected.is_bookmarked)}
                      className={`text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1.5 transition-all ${
                        selected.is_bookmarked 
                          ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:border-amber-200 hover:text-amber-600'
                      }`}
                    >
                      <FiStar className={`w-3 h-3 ${selected.is_bookmarked ? 'fill-current' : ''}`} />
                      {selected.is_bookmarked ? 'Bookmarked' : 'Bookmark'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Original problem */}
            {selected.input_text && (
              <div className="bg-white border border-[#d4c9b5] rounded-xl p-5 mb-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                  <span className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                    Original Problem
                  </span>
                </div>
                <p className="text-gray-800 text-base leading-relaxed">
                  {selected.input_text}
                </p>
              </div>
            )}

            {/* Key formulas */}
            {selected.key_formulas && selected.key_formulas.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                  <span className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                    Key Formulas
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.key_formulas.map(f => (
                    <span 
                      key={f} 
                      className="text-sm bg-white border border-[#d4c9b5] px-3 py-1.5 rounded-lg text-gray-700 font-mono"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Solution */}
            {selected.solution_markdown && (
              <div 
                className="bg-[#faf8f3] border border-[#d4c9b5] rounded-xl p-6 lg:p-8 shadow-sm"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 31px,
                    #d4c9b5 31px,
                    #d4c9b5 32px
                  )`,
                  backgroundSize: '100% 32px',
                }}
              >
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1 h-5 bg-[#8b7355] rounded-full"></div>
                  <span className="text-xs font-semibold text-[#8b7355] uppercase tracking-wider">
                    Solution
                  </span>
                </div>
                <div className="bg-transparent">
                  <MathRenderer>
                    {selected.solution_markdown}
                  </MathRenderer>
                </div>
              </div>
            )}

            {/* No solution fallback */}
            {!selected.solution_markdown && (
              <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                <FiFileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Solution not available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}