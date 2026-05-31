'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export const CURRICULA = [
  { id: 'NCERT',   label: 'NCERT',        flag: '🇮🇳', desc: 'Classes 9–12' },
  { id: 'CBSE',    label: 'CBSE',         flag: '🇮🇳', desc: 'Board exams' },
  { id: 'JEE',     label: 'JEE / NEET',  flag: '🇮🇳', desc: 'Entrance exams' },
  { id: 'IGCSE',   label: 'IGCSE',        flag: '🌐', desc: 'Cambridge' },
  { id: 'AP',      label: 'AP',           flag: '🇺🇸', desc: 'Advanced Placement' },
  { id: 'IB',      label: 'IB',           flag: '🌐', desc: 'International Baccalaureate' },
  { id: 'OpenStax',label: 'College / Uni',flag: '🎓', desc: 'Undergraduate' },
]

const STORAGE_KEY = 'solvr_curriculum'

interface CurriculumSelectorProps {
  value:    string
  onChange: (curriculum: string) => void
}

export default function CurriculumSelector({ value, onChange }: CurriculumSelectorProps) {
  const [open, setOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      // Close on escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [open])

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && CURRICULA.some(c => c.id === saved)) {
      onChange(saved)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const select = (id: string) => {
    onChange(id)
    localStorage.setItem(STORAGE_KEY, id)
    setOpen(false)
  }

  const current = CURRICULA.find(c => c.id === value) ?? CURRICULA[0]

  return (
    <div className="relative">
      <p className="text-xs text-muted font-mono mb-2">Your curriculum</p>
      
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 bg-white border border-line rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.98]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Selected curriculum: ${current.label}`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-lg sm:text-xl flex-shrink-0">{current.flag}</span>
          <div className="text-left min-w-0">
            <div className="text-sm font-semibold text-ink truncate">{current.label}</div>
            <div className="text-[10px] sm:text-xs text-muted font-mono truncate">{current.desc}</div>
          </div>
        </div>
        <motion.span
          className="text-muted text-xs sm:text-sm flex-shrink-0"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Mobile Full-Screen Overlay */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 bg-ink/10 backdrop-blur-sm z-40"
              />
            )}

            {/* Dropdown Menu */}
            <motion.div
              ref={dropdownRef}
              className={`bg-white border border-line rounded-xl overflow-hidden z-50 shadow-xl ${
                isMobile 
                  ? 'fixed inset-x-4 bottom-4 top-auto max-h-[70vh]' 
                  : 'absolute top-full left-0 right-0 mt-1.5'
              }`}
              initial={isMobile 
                ? { opacity: 0, y: 100 } 
                : { opacity: 0, y: -6, scale: 0.98 }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={isMobile 
                ? { opacity: 0, y: 100 } 
                : { opacity: 0, y: -6, scale: 0.98 }
              }
              transition={{ duration: 0.2 }}
              role="listbox"
              aria-label="Select curriculum"
            >
              {/* Mobile Handle */}
              {isMobile && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                  <h3 className="text-sm font-semibold text-ink">Select Curriculum</h3>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 hover:bg-line/30 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Scrollable List */}
              <div className={`overflow-y-auto ${isMobile ? 'max-h-[60vh]' : 'max-h-80'}`}>
                {CURRICULA.map((c, index) => (
                  <motion.button
                    key={c.id}
                    onClick={() => select(c.id)}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-colors ${
                      c.id === value 
                        ? 'bg-primary/5 border-l-2 border-primary' 
                        : 'hover:bg-paper border-l-2 border-transparent'
                    }`}
                    role="option"
                    aria-selected={c.id === value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <span className="text-lg sm:text-xl flex-shrink-0">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${
                        c.id === value ? 'text-primary' : 'text-ink/80'
                      }`}>
                        {c.label}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted font-mono truncate">
                        {c.desc}
                      </div>
                    </div>
                    {c.id === value && (
                      <motion.span 
                        className="text-primary text-sm flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        ✓
                      </motion.span>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="px-3 sm:px-4 py-2.5 border-t border-line bg-paper/50">
                <p className="text-[10px] sm:text-xs text-muted font-mono">
                  We use this to find matching textbook content
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}