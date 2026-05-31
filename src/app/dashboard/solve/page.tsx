'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FiCamera, 
  FiTrash2, 
  FiSend, 
  FiBookOpen, 
  FiCheckCircle, 
  FiXCircle,
  FiLoader,
  FiSmile,
  FiFrown,
  FiImage,
  FiType,
  FiChevronRight,
  FiGrid,
  FiSliders
} from 'react-icons/fi'
import { 
  MdSchool, 
  MdScience, 
  MdBiotech, 
  MdCalculate 
} from 'react-icons/md'
import { GiAbacus, GiMicroscope, GiChemicalDrop } from 'react-icons/gi'
import MathRenderer from '@/components/MathRenderer'
import CurriculumSelector from '@/components/CurriculumSelector'
import { fileToBase64, SUBJECT_CONFIG } from '@/lib/utils'
import type { Subject } from '@/types'
import toast from 'react-hot-toast'

// ── Types ─────────────────────────────────────────────────────────────────────
type SolveState = 'idle' | 'solving' | 'done' | 'error'

interface SolutionMeta {
  topic?:            string
  difficulty?:       string
  keyFormulas?:      string[]
  processingTimeMs?: number
}

// ── Subject options with React Icons ──────────────────────────────────────────
const SUBJECTS = [
  { id: 'mathematics' as Subject, label: 'Maths', icon: MdCalculate, color: '#7C3AED', bg: '#F3E8FF' },
  { id: 'physics' as Subject, label: 'Physics', icon: MdScience, color: '#2563EB', bg: '#EFF6FF' },
  { id: 'chemistry' as Subject, label: 'Chemistry', icon: GiChemicalDrop, color: '#059669', bg: '#ECFDF5' },
  { id: 'biology' as Subject, label: 'Biology', icon: GiMicroscope, color: '#EA580C', bg: '#FFF7ED' },
  { id: 'general' as Subject, label: 'Other', icon: FiBookOpen, color: '#6B7280', bg: '#F9FAFB' },
]

// ── Example prompts with emojis ───────────────────────────────────────────────
const EXAMPLES: Record<Subject | 'general', { text: string; emoji: string }[]> = {
  mathematics: [
    { text: 'A car travels 150km in 2.5 hours. What is its average speed?', emoji: '🚗' },
    { text: 'Find the area of a circle with radius 7cm', emoji: '⚪' },
    { text: 'Solve for x: 3x + 12 = 33', emoji: '✖️' },
    { text: 'What is the derivative of x² + 5x?', emoji: '📈' },
  ],
  physics: [
    { text: 'A ball is dropped from 45m. How long to hit the ground?', emoji: '⚽' },
    { text: 'What force is needed to accelerate a 10kg object at 3 m/s²?', emoji: '💪' },
    { text: 'A wire carries 2A through a 5Ω resistor. What is the voltage?', emoji: '⚡' },
    { text: 'An object moves at 60 m/s and decelerates at 4 m/s². How far to stop?', emoji: '🏃' },
  ],
  chemistry: [
    { text: 'What happens when sodium is added to water?', emoji: '💧' },
    { text: 'Balance this equation: H₂ + O₂ → H₂O', emoji: '⚖️' },
    { text: 'What is the pH of a 0.01M HCl solution?', emoji: '🔬' },
    { text: 'Describe the reaction between acids and bases', emoji: '🧪' },
  ],
  biology: [
    { text: 'Explain how photosynthesis works', emoji: '🌱' },
    { text: 'What is the role of mitochondria in a cell?', emoji: '🔋' },
    { text: 'How does DNA replication occur?', emoji: '🧬' },
    { text: 'What is the difference between mitosis and meiosis?', emoji: '🧫' },
  ],
  general: [
    { text: "Explain Newton's three laws of motion", emoji: '🍎' },
    { text: 'What is the difference between speed and velocity?', emoji: '📏' },
    { text: 'How do vaccines work?', emoji: '💉' },
    { text: 'What causes rainbows?', emoji: '🌈' },
  ],
}

// ── Mobile bottom sheet component ────────────────────────────────────────────
function BottomSheet({ isOpen, onClose, children, title }: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode;
  title: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 lg:hidden max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <FiXCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SolvePage() {
  const [subject, setSubject] = useState<Subject>('mathematics')
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [state, setState] = useState<SolveState>('idle')
  const [solution, setSolution] = useState('')
  const [metadata, setMetadata] = useState<SolutionMeta | null>(null)
  const [showExamples, setShowExamples] = useState(true)
  const [curriculum, setCurriculum] = useState('NCERT')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const solutionRef = useRef<HTMLDivElement>(null)
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const activeSubject = SUBJECTS.find(s => s.id === subject)!

  // Auto-scroll solution
  useEffect(() => {
    if (state === 'solving') {
      solutionRef.current?.scrollTo({ top: solutionRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [solution, state])

  // Hide examples when typing
  useEffect(() => {
    setShowExamples(text.length === 0 && !file)
  }, [text, file])

  const handleFileUpload = useCallback((f: File) => {
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP)')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Max 10MB.')
      return
    }
    setFile(f)
    setText('')
    setPreview(URL.createObjectURL(f))
    setShowExamples(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: (accepted) => {
      if (accepted[0]) handleFileUpload(accepted[0])
    },
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  })

  const clearInput = () => {
    setFile(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    setText('')
    textareaRef.current?.focus()
  }

  const handleSolve = async () => {
    if (state === 'solving') {
      readerRef.current?.cancel()
      setState('idle')
      return
    }

    const hasText = text.trim().length >= 3
    const hasImage = !!file

    if (!hasText && !hasImage) {
      toast.error('Type your question or upload a photo first')
      textareaRef.current?.focus()
      return
    }

    setState('solving')
    setSolution('')
    setMetadata(null)

    try {
      const body: Record<string, unknown> = {
        subject,
        inputType: hasImage ? 'image' : 'text',
        curriculum,
      }

      if (hasImage && file) {
        body.fileBase64 = await fileToBase64(file)
        body.mimeType = file.type
      } else {
        body.text = text.trim()
      }

      const res = await fetch('/api/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong' }))
        if (res.status === 402) {
          toast.error("You've used all your problems this month. Tap 'Upgrade' to continue.", { duration: 6000 })
        } else if (res.status === 429) {
          toast.error("You're going too fast! Wait a moment and try again.")
        } else if (res.status === 403) {
          toast.error('Photo upload is available on the Basic plan. Upgrade to use this feature.')
        } else {
          toast.error(err.error || 'Something went wrong. Please try again.')
        }
        setState('error')
        return
      }

      const reader = res.body!.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'delta') setSolution(prev => prev + data.content)
            if (data.type === 'done') { setMetadata(data.metadata as SolutionMeta); setState('done') }
            if (data.type === 'error') { toast.error('AI error. Please try again.'); setState('error') }
          } catch { /* ignore */ }
        }
      }
    } catch {
      toast.error('Connection lost. Check your internet and try again.')
      setState('error')
    }
  }

  const handleNewQuestion = () => {
    setState('idle')
    setSolution('')
    setMetadata(null)
  }

  const handleExampleClick = (exampleText: string) => {
    setText(exampleText)
    setFile(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    textareaRef.current?.focus()
    setIsMobileMenuOpen(false)
  }

  const difficultyStyle: Record<string, { label: string; color: string; bg: string }> = {
    easy: { label: 'Easy', color: '#059669', bg: '#ECFDF5' },
    medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
    hard: { label: 'Hard', color: '#EA580C', bg: '#FFF7ED' },
    expert: { label: 'Expert', color: '#DC2626', bg: '#FEF2F2' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white lg:flex lg:overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-20 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <FiBookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">StudyAI</h1>
            <p className="text-xs text-gray-500">Ask anything, learn better</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <FiSliders className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Mobile Settings Bottom Sheet */}
      <BottomSheet isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} title="Settings">
        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Subject</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map(s => {
                const Icon = s.icon
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSubject(s.id)
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      subject === s.id
                        ? `border-${s.color} bg-${s.color}/10`
                        : 'border-gray-200 bg-white'
                    }`}
                    style={subject === s.id ? { borderColor: s.color, background: `${s.color}10` } : {}}
                  >
                    <Icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-sm font-medium" style={{ color: subject === s.id ? s.color : '#6B7280' }}>
                      {s.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Curriculum</label>
            <CurriculumSelector value={curriculum} onChange={setCurriculum} />
          </div>
        </div>
      </BottomSheet>

      {/* Input Section - Responsive */}
      <div className={`
        lg:w-[420px] lg:flex-shrink-0 lg:border-r lg:border-gray-200 lg:bg-white
        ${isMobile ? 'flex-1' : ''}
      `}>
        <div className="h-full flex flex-col">
          {/* Desktop Header */}
          <div className="hidden lg:block px-6 py-5 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900">Ask a question</h1>
            <p className="text-sm text-gray-500 mt-1">Type it or take a photo — we do the rest</p>
          </div>

          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 lg:py-6 space-y-5">
            {/* Desktop Subject Picker */}
            <div className="hidden lg:block">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Subject</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map(s => {
                  const Icon = s.icon
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSubject(s.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all"
                      style={subject === s.id
                        ? { borderColor: s.color, color: s.color, background: `${s.color}10` }
                        : { borderColor: '#E5E7EB', color: '#6B7280' }
                      }
                    >
                      <Icon className="w-4 h-4" />
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Desktop Curriculum Selector */}
            <div className="hidden lg:block">
              <CurriculumSelector value={curriculum} onChange={setCurriculum} />
            </div>

            {/* Unified Input Area */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Your question</label>
              
              <div
                {...getRootProps()}
                className={`relative rounded-2xl border-2 transition-all ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : file || text.trim()
                    ? 'border-primary-300 bg-white'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input {...getInputProps()} ref={fileInputRef} />
                
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onFocus={() => setIsTyping(true)}
                  onBlur={() => setIsTyping(false)}
                  placeholder={`Type your ${activeSubject.label.toLowerCase()} question here...`}
                  rows={isMobile ? 3 : 4}
                  disabled={!!file}
                  maxLength={4000}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleSolve()
                    }
                  }}
                  className="w-full bg-transparent border-none rounded-t-2xl px-4 pt-4 pb-2 text-gray-700 placeholder-gray-400 focus:outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed text-base"
                />
                
                <AnimatePresence>
                  {file && preview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="relative mx-4 mb-3"
                    >
                      <div className="relative inline-block">
                        <img
                          src={preview}
                          alt="Uploaded question"
                          className="max-h-32 w-auto rounded-xl border border-gray-200 object-contain bg-gray-50"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearInput()
                          }}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center text-sm transition-colors shadow-sm"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Photo attached ✓</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (file) {
                          clearInput()
                        } else {
                          open()
                        }
                      }}
                      className={`p-2 rounded-xl transition-all flex items-center gap-2 ${
                        file
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FiCamera className="w-4 h-4" />
                      <span className="text-xs font-medium hidden sm:inline">
                        {file ? 'Photo added' : 'Add photo'}
                      </span>
                    </button>
                    
                    {(text.trim() || file) && (
                      <button
                        onClick={clearInput}
                        className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    {(text.trim() || file) ? (
                      <span>⌘/Ctrl + ↵</span>
                    ) : (
                      <span className="flex items-center gap-1"><FiImage className="w-3 h-3" /> Drag or tap</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Example Questions */}
            <AnimatePresence>
              {showExamples && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3 block">Try an example</label>
                  <div className="space-y-2">
                    {EXAMPLES[subject].slice(0, isMobile ? 3 : 4).map((ex, i) => (
                      <motion.button
                        key={ex.text}
                        onClick={() => handleExampleClick(ex.text)}
                        className="w-full text-left flex items-start gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-white transition-all group"
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <span className="text-lg">{ex.emoji}</span>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900 flex-1">"{ex.text}"</span>
                        <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 mt-0.5" />
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Solve Button */}
          <div className="p-4 lg:p-6 border-t border-gray-100 bg-white lg:bg-transparent sticky bottom-0">
            <motion.button
              onClick={handleSolve}
              className="w-full py-3.5 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
              style={{
                background: state === 'solving'
                  ? '#DC2626'
                  : (text.trim() || file) ? activeSubject.color : '#F3F4F6',
                color: (text.trim() || file || state === 'solving') ? '#FFFFFF' : '#9CA3AF',
              }}
              whileHover={(text.trim() || file) ? { scale: 1.02 } : {}}
              whileTap={(text.trim() || file) ? { scale: 0.98 } : {}}
            >
              {state === 'solving' ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Stop solving
                </>
              ) : file ? (
                <>
                  <FiCamera className="w-4 h-4" />
                  Solve this photo
                </>
              ) : text.trim() ? (
                <>
                  <FiSend className="w-4 h-4" />
                  Get solution
                </>
              ) : (
                'Type or upload a question'
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Solution Panel - Responsive */}
      <div className="flex-1 flex flex-col bg-white lg:bg-gray-50">
        {/* Solution Header */}
        <div className="sticky top-0 lg:top-auto bg-white lg:bg-transparent border-b border-gray-100 px-4 lg:px-8 py-3 lg:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center lg:hidden`} style={{ background: `${activeSubject.color}15` }}>
              {(() => {
                const Icon = activeSubject.icon
                return <Icon className="w-5 h-5" style={{ color: activeSubject.color }} />
              })()}
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm lg:text-base" style={{ color: activeSubject.color }}>
                {state === 'done' && metadata?.topic
                  ? String(metadata.topic)
                  : activeSubject.label}
              </div>
              <div className="text-xs text-gray-500">
                {state === 'solving' && 'Working it out...'}
                {state === 'done' && 'Solution ready'}
                {state === 'idle' && 'Waiting for your question'}
                {state === 'error' && 'Something went wrong'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {state === 'done' && metadata?.difficulty && (() => {
              const diff = metadata?.difficulty ?? ''
              const ds = difficultyStyle[diff] ?? difficultyStyle.medium
              return (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ color: ds.color, background: ds.bg }}>
                  {ds.label}
                </span>
              )
            })()}
            {state === 'done' && (
              <button
                onClick={handleNewQuestion}
                className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-white transition-colors"
              >
                New
              </button>
            )}
          </div>
        </div>

        {/* Solution Content */}
        <div ref={solutionRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-8">
          {/* Idle State */}
          {state === 'idle' && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mb-5"
              >
                {(() => {
                  const Icon = activeSubject.icon
                  return <Icon className="w-10 h-10 text-gray-400" />
                })()}
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Your solution will appear here</h3>
              <p className="text-sm text-gray-500 max-w-xs">Ask anything — type it out or snap a photo of your question</p>
            </div>
          )}

          {/* Solving State */}
          {state === 'solving' && !solution && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-12 h-12 border-3 border-primary-200 border-t-primary-600 rounded-full"
              />
              <div className="text-center">
                <p className="font-semibold text-gray-700 mb-1">Working it out...</p>
                <p className="text-sm text-gray-500">AI is reading your question</p>
              </div>
            </div>
          )}

          {/* Solution Content */}
          {(state === 'solving' || state === 'done') && solution && (
            <div className="max-w-3xl mx-auto">
              <div className="prose prose-gray max-w-none">
                <MathRenderer streaming={state === 'solving'}>
                  {solution}
                </MathRenderer>
              </div>

              {state === 'done' && metadata?.keyFormulas && metadata.keyFormulas.length > 0 && (
                <motion.div
                  className="mt-8 pt-6 border-t border-gray-100"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <FiBookOpen className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Key formulas used</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(metadata?.keyFormulas ?? []).map((f: string) => (
                      <div
                        key={f}
                        className="px-3 py-2 rounded-xl text-sm font-mono bg-gray-50 border border-gray-100 text-gray-700"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {state === 'done' && (
                <motion.div
                  className="mt-6 flex items-center gap-4 pt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-sm text-gray-500">Was this helpful?</span>
                  <button
                    onClick={() => toast.success('Great! Glad it helped.')}
                    className="p-2 hover:bg-green-50 rounded-full transition-colors"
                  >
                    <FiSmile className="w-5 h-5 text-green-600" />
                  </button>
                  <button
                    onClick={() => toast.success('Thanks for the feedback.')}
                    className="p-2 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <FiFrown className="w-5 h-5 text-red-600" />
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Error State */}
          {state === 'error' && !solution && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                <FiXCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Something went wrong</h3>
                <p className="text-sm text-gray-500">Check your connection and try again</p>
              </div>
              <button
                onClick={handleNewQuestion}
                className="text-sm text-primary-600 border border-primary-200 px-5 py-2 rounded-xl hover:bg-primary-50 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}