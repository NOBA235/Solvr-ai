// ============================================================
//  POST /api/solve  — RAG-enhanced streaming solver
// ============================================================
import { NextRequest } from 'next/server'
import { apiGuard, apiError } from '@/lib/api-guard'
import { validateSolvePayload, ValidationError } from '@/lib/validate'
import { streamSolution } from '@/lib/anthropic/solver'
import { createClient } from '@/lib/supabase/server'
import type { Subject } from '@/types'

export const runtime    = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  // 1. Auth + quota guard
  const guard = await apiGuard({ checkProblemQuota: true })
  if ('status' in guard) return guard
  const { user } = guard

  // 2. Parse + validate
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON body', 400) }

  let payload
  try { payload = validateSolvePayload(body) }
  catch (e) {
    if (e instanceof ValidationError) return apiError(e.message, 400, { field: e.field })
    return apiError('Validation failed', 400)
  }

  // 3. Feature gates
  if (payload.inputType === 'image') {
    const g = await apiGuard({ requireFeature: 'imageUpload' })
    if ('status' in g) return g
  }
  if (payload.inputType === 'pdf') {
    const g = await apiGuard({ requireFeature: 'pdfUpload' })
    if ('status' in g) return g
  }

  // 4. Extract curriculum preference (optional — sent from solve page)
  const curriculum = typeof (body as Record<string, unknown>).curriculum === 'string'
    ? (body as Record<string, unknown>).curriculum as string
    : undefined

  const startMs = Date.now()
  let fullText  = ''

  // 5. Stream RAG-enhanced solution
  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (obj: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

      try {
        const claudeStream = await streamSolution({
          subject:      payload.subject as Subject,
          inputText:    payload.text,
          imageBase64:  payload.fileBase64,
          imageMimeType: payload.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' | undefined,
          curriculum,
        })

        for await (const event of claudeStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text
            fullText += chunk
            send({ type: 'delta', content: chunk })
          }
        }

        const processingMs = Date.now() - startMs

        // Extract metadata from completed text
        const topicMatch   = fullText.match(/\*\*Topic:\*\*\s*(.+)/i)
        const diffMatch    = fullText.match(/\*\*Difficulty:\*\*\s*(easy|medium|hard|expert)/i)
        const formulaMatch = fullText.match(/\*\*Key Formulas:\*\*\s*(.+)/i)

        const metadata = {
          topic:            topicMatch?.[1]?.trim(),
          difficulty:       diffMatch?.[1]?.toLowerCase(),
          keyFormulas:      formulaMatch?.[1]?.split(',').map((f: string) => f.trim()).filter(Boolean),
          processingTimeMs: processingMs,
        }

        send({ type: 'done', metadata })
        controller.close()

        // 6. Persist to DB + increment usage (fire-and-forget)
        const supabase = await createClient()
        await Promise.all([
          supabase.from('problems').insert({
            user_id:            user.id,
            subject:            payload.subject,
            input_type:         payload.inputType,
            input_text:         payload.text ?? null,
            solution_markdown:  fullText,
            topic:              metadata.topic ?? null,
            difficulty:         metadata.difficulty ?? null,
            key_formulas:       metadata.keyFormulas ?? null,
            processing_time_ms: processingMs,
            model_used:         'claude-sonnet-4-20250514',
          }),
          supabase.rpc('increment_problems_used', { user_id: user.id }),
        ])

      } catch (err) {
        console.error('[/api/solve]', err)
        send({ type: 'error', error: 'AI processing failed. Please try again.' })
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':          'text/event-stream',
      'Cache-Control':         'no-cache, no-transform',
      'X-Content-Type-Options': 'nosniff',
      'Connection':            'keep-alive',
    },
  })
}
