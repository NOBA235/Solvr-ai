'use client'
//  MathRenderer
//  Renders markdown with full LaTeX support via KaTeX.
//  Handles:
//    Inline math:  $F = ma$  →  F = ma (inline)
//    Block math:   $$\int_0^\infty e^{-x}dx$$  →  centred display
//    Code blocks:  ```python  →  syntax highlighted
//    Tables, lists, headers, bold, etc.

import ReactMarkdown from 'react-markdown'
import remarkMath    from 'remark-math'
import rehypeKatex  from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import type { Components } from 'react-markdown'

interface MathRendererProps {
  children: string
  /** Show a blinking cursor at the end (streaming mode) */
  streaming?: boolean
  className?: string
}

// Custom component overrides — NOTEBOOK THEME (dark text on light background)
const components: Components = {
  // ── Headings 
  h1: ({ children }) => (
    <h1 className="text-xl font-extrabold text-gray-900 mt-6 mb-3 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2 border-b border-[#d4c9b5] pb-2" style={{ fontFamily: 'Georgia, serif' }}>
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-gray-800 mt-4 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-gray-700 mt-3 mb-1.5" style={{ fontFamily: 'Georgia, serif' }}>
      {children}
    </h4>
  ),

  // ── Body text 
  p: ({ children }) => (
    <p className="text-base text-gray-900 leading-relaxed mb-3">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="text-gray-950 font-semibold">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-gray-700 italic">{children}</em>
  ),

  // ── Lists ───
  ul: ({ children }) => (
    <ul className="list-none space-y-1.5 mb-3 ml-2">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside space-y-1.5 mb-3 ml-2 text-gray-900">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-base text-gray-900 flex items-start gap-2">
      <span className="text-[#8b7355] mt-0.5 text-xs flex-shrink-0">▸</span>
      <span>{children}</span>
    </li>
  ),

  // ── Code 
  code: ({ className, children, ...props }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className={`${className || ''} text-sm`} {...props}>
          {children}
        </code>
      )
    }
    // Inline code — but NOT math (KaTeX handles those)
    return (
      <code
        className="bg-[#f0ebe0] text-[#4a3728] font-mono text-sm px-1.5 py-0.5 rounded border border-[#d4c9b5]"
        {...props}
      >
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-[#f5f0e8] border border-[#d4c9b5] rounded-xl p-4 mb-4 overflow-x-auto text-sm leading-relaxed text-gray-900">
      {children}
    </pre>
  ),

  // ── Block quote (used for hints/notes)
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-[#8b7355] pl-4 my-3 italic text-gray-700 text-base">
      {children}
    </blockquote>
  ),

  // ── Divider ─
  hr: () => <hr className="border-[#d4c9b5] my-5" />,

  // ── Tables ─
  table: ({ children }) => (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-base border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-[#f0ebe0]">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left px-3 py-2 text-sm font-semibold text-gray-800 tracking-wider border-b border-[#d4c9b5]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-base text-gray-900 border-b border-[#e8ddd0]">
      {children}
    </td>
  ),

  // ── Links ──
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="text-[#8b7355] underline underline-offset-2 hover:text-[#5c4d3c] transition-colors">
      {children}
    </a>
  ),
}

export default function MathRenderer({ children, streaming = false, className = '' }: MathRendererProps) {
  return (
    <div className={`math-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[
          [rehypeKatex, {
            // KaTeX options
            throwOnError: false,         // never crash — show error marker instead
            errorColor:   '#dc2626',     // red error markers for visibility
            strict:       false,         // allow some non-standard LaTeX
            trust:        false,         // don't trust HTML in LaTeX
            output:       'htmlAndMathml', // best browser compat + accessibility
          }],
          rehypeHighlight,
        ]}
        components={components}
      >
        {children}
      </ReactMarkdown>

      {/* Blinking cursor for streaming mode */}
      {streaming && (
        <span className="inline-block w-0.5 h-4 bg-[#8b7355] ml-0.5 align-middle animate-[cursor-blink_0.6s_ease-in-out_infinite]" />
      )}
    </div>
  )
}