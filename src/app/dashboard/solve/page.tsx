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
  FiChevronRight,
  FiSliders,
  FiBook,
  FiZap,
  FiTriangle,
  FiCircle,
  FiHexagon,
  FiDroplet,
  FiHeart,
  FiActivity,
  FiBox
} from 'react-icons/fi'
import { 
  MdScience, 
  MdBiotech, 
  MdCalculate,
  MdFunctions,
  MdTimeline,
  MdSpeed,
  MdBluetooth,
  MdWaterDrop,
  MdBiotech as MdDna,
  MdScience as MdPhysics,
  MdScience as MdChemistry
} from 'react-icons/md'
import { GiMicroscope, GiChemicalDrop, GiDna1, GiAtom, GiBrain } from 'react-icons/gi'
import { 
  FaSquareRootAlt, 
  FaDivide, 
  FaSuperscript,
  FaFlask,
  FaLeaf,
  FaBolt,
  FaMagnet,
  FaVial
} from 'react-icons/fa'
import { 
  SiLatex, 
  SiWolfram, 
  SiPython,
  SiR
} from 'react-icons/si'
import { 
  TbMath, 
  TbMathFunction, 
  TbMathIntegral,
  TbMathSymbols,
  TbAtom,
  TbAtom2,
  TbFlask,
  TbFlask2,
  TbMicroscope,
  TbDna,
  TbDna2,
  TbBrain,
  TbChartBar,
  TbChartLine,
  TbFunction
} from 'react-icons/tb'
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

// ── Subject options with proper React Icons ──────────────────────────────────
const SUBJECTS = [
  { 
    id: 'mathematics' as Subject, 
    label: 'Maths', 
    icon: TbMath, 
    color: '#7C3AED', 
    bg: '#F3E8FF',
    secondaryIcon: TbMathFunction 
  },
  { 
    id: 'physics' as Subject, 
    label: 'Physics', 
    icon: TbAtom, 
    color: '#2563EB', 
    bg: '#EFF6FF',
    secondaryIcon: FaBolt
  },
  { 
    id: 'chemistry' as Subject, 
    label: 'Chemistry', 
    icon: TbFlask, 
    color: '#059669', 
    bg: '#ECFDF5',
    secondaryIcon: FaVial
  },
  { 
    id: 'biology' as Subject, 
    label: 'Biology', 
    icon: TbDna, 
    color: '#EA580C', 
    bg: '#FFF7ED',
    secondaryIcon: FaLeaf
  },
  { 
    id: 'general' as Subject, 
    label: 'Other', 
    icon: FiBookOpen, 
    color: '#6B7280', 
    bg: '#F9FAFB',
    secondaryIcon: FiBook
  },
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
                        ? 'border-current'
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

      {/* Solution Panel - FIXED: Dark text on white background */}
      <div className="flex-1 flex flex-col bg-gray-100 lg:p-6 overflow-hidden">
        <div className="flex-1 flex flex-col bg-white shadow-2xl lg:rounded-lg relative w-full max-w-4xl mx-auto overflow-hidden border border-gray-200">
          
          {/* Solution Header */}
          <div className="relative z-10 px-6 lg:px-10 py-5 flex items-start justify-between border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Subject:</span>
                <div className="font-semibold text-sm lg:text-base flex items-center gap-1.5 text-gray-900">
                  {(() => {
                    const Icon = activeSubject.icon
                    const SecondaryIcon = activeSubject.secondaryIcon
                    return (
                      <>
                        <Icon className="w-4 h-4" style={{ color: activeSubject.color }} />
                        <span className="mx-1 text-gray-300">·</span>
                        <SecondaryIcon className="w-3.5 h-3.5 opacity-75" style={{ color: activeSubject.color }} />
                      </>
                    )
                  })()}
                  <span style={{ color: activeSubject.color }}>{activeSubject.label}</span>
                </div>
              </div>
              
              {state === 'done' && metadata?.topic && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Topic:</span>
                  <span className="text-gray-800 text-sm font-medium flex items-center gap-1.5">
                    <FiBook className="w-3.5 h-3.5 text-gray-400" />
                    {String(metadata.topic)}
                  </span>
                </div>
              )}
              
              <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                {state === 'solving' && (
                  <>
                    <FiLoader className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    <span>Solving your problem...</span>
                  </>
                )}
                {state === 'done' && (
                  <>
                    <FiCheckCircle className="w-3.5 h-3.5 text-green-500" />
                    <span>Solution ready</span>
                  </>
                )}
                {state === 'idle' && (
                  <>
                    <FiBookOpen className="w-3.5 h-3.5 text-gray-400" />
                    <span>Ready to solve</span>
                  </>
                )}
                {state === 'error' && (
                  <>
                    <FiXCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Something went wrong</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3 pt-1">
              <div className="flex items-center gap-4">
                {state === 'done' && metadata?.difficulty && (() => {
                  const diff = metadata?.difficulty ?? ''
                  const ds = difficultyStyle[diff] ?? difficultyStyle.medium
                  return (
                    <span 
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm" 
                      style={{ color: ds.color, background: ds.bg }}
                    >
                      {diff === 'easy' && <FiSmile className="w-3 h-3" />}
                      {diff === 'medium' && <FiZap className="w-3 h-3" />}
                      {diff === 'hard' && <FiActivity className="w-3 h-3" />}
                      {diff === 'expert' && <FiZap className="w-3 h-3" />}
                      {ds.label}
                    </span>
                  )
                })()}
                
                {state === 'done' && (
                  <button
                    onClick={handleNewQuestion}
                    className="text-sm text-gray-700 hover:text-gray-900 px-4 py-2 font-medium hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1.5 border border-gray-200"
                  >
                    New Question <FiChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {state === 'done' && metadata?.processingTimeMs && (
                <span className="text-xs text-gray-400">
                  Solved in {(metadata.processingTimeMs / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          </div>

          {/* Solution Content - EXPLICIT DARK TEXT STYLING */}
          <div 
            ref={solutionRef} 
            className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 relative z-10 bg-white"
            style={{ color: '#1f2937' }} // Explicit dark gray text color
          >
            <div className="relative min-h-full max-w-3xl mx-auto">
              
              {/* Idle State */}
              {state === 'idle' && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="mb-6 text-gray-300"
                  >
                    {(() => {
                      const Icon = activeSubject.icon
                      return <Icon className="w-20 h-20" />
                    })()}
                  </motion.div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Ready to Help</h3>
                  <p className="text-gray-600 max-w-md">
                    Type your {activeSubject.label.toLowerCase()} question or upload a photo to get a detailed solution.
                  </p>
                  <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-left border border-blue-200">
                      <FiCamera className="w-5 h-5 text-blue-500 mb-2" />
                      <p className="text-sm font-semibold text-gray-800">Upload Photo</p>
                      <p className="text-xs text-gray-600 mt-1">Snap a pic of your problem</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-left border border-purple-200">
                      <FiSend className="w-5 h-5 text-purple-500 mb-2" />
                      <p className="text-sm font-semibold text-gray-800">Type Question</p>
                      <p className="text-xs text-gray-600 mt-1">Or write it out in words</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Solving State */}
              {state === 'solving' && !solution && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-14 h-14 border-4 border-gray-200 border-t-blue-500 rounded-full"
                  />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2 justify-center">
                      <TbBrain className="w-5 h-5 text-blue-500" />
                      Thinking...
                    </p>
                    <p className="text-sm text-gray-600">Analyzing your {activeSubject.label.toLowerCase()} problem</p>
                  </div>
                </div>
              )}

              {/* Solution Content - FIXED: Dark text with explicit styling */}
              {(state === 'solving' || state === 'done') && solution && (
                <div className="text-gray-900">
                  {/* Solution Text - Explicit dark text styling */}
                  <div className="text-gray-900 leading-relaxed text-base lg:text-lg">
                    <MathRenderer streaming={state === 'solving'}>
                      {solution}
                    </MathRenderer>
                  </div>

                  {/* Key Formulas */}
                  {state === 'done' && metadata?.keyFormulas && metadata.keyFormulas.length > 0 && (
                    <motion.div
                      className="mt-10 mb-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Key Formulas</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(metadata?.keyFormulas ?? []).map((f: string, i: number) => (
                          <div
                            key={i}
                            className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-gray-800 flex items-center gap-3 hover:bg-blue-100 transition-colors"
                          >
                            <TbMathFunction className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Feedback Section */}
                  {state === 'done' && (
                    <motion.div
                      className="mt-12 pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <span className="text-sm text-gray-700 font-medium">Was this solution helpful?</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toast.success('Great! Glad it helped.')}
                          className="p-2.5 hover:bg-green-50 rounded-lg transition-colors border border-gray-200 hover:border-green-300 group"
                          title="Yes, helpful"
                        >
                          <FiSmile className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                        </button>
                        <button
                          onClick={() => toast.success("Thanks for the feedback. We'll improve.")}
                          className="p-2.5 hover:bg-red-50 rounded-lg transition-colors border border-gray-200 hover:border-red-300 group"
                          title="No, not helpful"
                        >
                          <FiFrown className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Error State */}
              {state === 'error' && !solution && (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center border-2 border-red-200">
                    <FiXCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Something went wrong</h3>
                    <p className="text-sm text-gray-600">Please check your connection or try rephrasing your question.</p>
                  </div>
                  <button
                    onClick={handleNewQuestion}
                    className="mt-2 text-sm font-medium text-gray-700 bg-white shadow-sm border border-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Clear and try again
                  </button>
                </div>
              )}
              
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}