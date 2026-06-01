//FOR PRODUCTION
/*import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { apiGuard, apiError } from '@/lib/api-guard'
import { validateLabPayload, ValidationError } from '@/lib/validate'
import { SUBJECT_PROMPTS, VALID_EFFECTS } from '@/lib/anthropic/lab-prompts'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
export async function POST(req: NextRequest) {
  // Auth + lab feature gate
  const guard = await apiGuard({ requireFeature: 'labAccess' })
  if ('status' in guard) return guard

  const { user } = guard

  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON', 400) }

  let payload
  try { payload = validateLabPayload(body) }
  catch (e) {
    if (e instanceof ValidationError) return apiError(e.message, 400, { field: e.field })
    return apiError('Validation failed', 400)
  }

  const systemPrompt = SUBJECT_PROMPTS[payload.subject]
  if (!systemPrompt) return apiError('Invalid subject', 400)

  const userPrompt = `Inputs: ${payload.inputs.join(', ')}\nEquipment: ${payload.equipment.join(', ') || 'standard'}\nAction: ${payload.action}\nRespond only with the JSON object.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : ''
    if (!raw) throw new Error('Empty response')

    let result: Record<string, unknown>
    try {
      result = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('Invalid JSON from AI')
      result = JSON.parse(match[0])
    }

    const validEffects = VALID_EFFECTS[payload.subject] || ['none']
    if (!validEffects.includes(result.visualEffect as string)) {
      result.visualEffect = 'none'
    }

    const supabase = await createClient()
    const { data: experiment } = await supabase
      .from('experiments')
      .insert({
        user_id:   user.id,
        subject:   payload.subject,
        inputs:    payload.inputs,
        equipment: payload.equipment,
        action:    payload.action,
        result,
      })
      .select('id')
      .single()

    return NextResponse.json({ experimentId: experiment?.id, result })
  } catch (err) {
    console.error('[/api/lab/react]', err)
    return apiError('AI processing failed', 500)
  }
}*/
  
//TESTING

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { apiGuard, apiError } from '@/lib/api-guard'
import { validateLabPayload, ValidationError } from '@/lib/validate'
import { SUBJECT_PROMPTS, VALID_EFFECTS } from '@/lib/anthropic/lab-prompts'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  // Auth + lab feature gate
  const guard = await apiGuard({ requireFeature: 'labAccess' })
  if ('status' in guard) return guard

  const { user } = guard

  let body: unknown
  try { 
    body = await req.json() 
  } catch { 
    return apiError('Invalid JSON', 400) 
  }

  let payload
  try { 
    payload = validateLabPayload(body) 
  } catch (e) {
    if (e instanceof ValidationError) {
      return apiError(e.message, 400, { field: e.field })
    }
    return apiError('Validation failed', 400)
  }

  const systemPrompt = SUBJECT_PROMPTS[payload.subject]
  if (!systemPrompt) {
    return apiError('Invalid subject', 400)
  }

  const userPrompt = `Inputs: ${payload.inputs.join(', ')}
Equipment: ${payload.equipment.join(', ') || 'standard'}
Action: ${payload.action}

Respond only with the JSON object.`

  try {
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        maxOutputTokens: 800,
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      },
    })

    // Combine system prompt with user prompt (Gemini doesn't have separate system param)
    const fullPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`
    
    // Generate content
    const result = await model.generateContent(fullPrompt)
    const response = result.response
    const raw = response.text().trim()

    if (!raw) {
      throw new Error('Empty response from Gemini')
    }

    // Parse JSON from response
    let parsedResult: Record<string, unknown>
    try {
      parsedResult = JSON.parse(raw)
    } catch {
      // Try to extract JSON from markdown code blocks or text
      const jsonMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/) || 
                       raw.match(/\{[\s\S]*\}/)
      
      if (!jsonMatch) {
        throw new Error('Invalid JSON from AI')
      }
      
      const jsonString = jsonMatch[1] || jsonMatch[0]
      try {
        parsedResult = JSON.parse(jsonString.trim())
      } catch {
        throw new Error('Failed to parse extracted JSON')
      }
    }

    // Validate visual effect
    const validEffects = VALID_EFFECTS[payload.subject] || ['none']
    if (!validEffects.includes(parsedResult.visualEffect as string)) {
      parsedResult.visualEffect = 'none'
    }

    // Save to database
    const supabase = await createClient()
    const { data: experiment, error: dbError } = await supabase
      .from('experiments')
      .insert({
        user_id:   user.id,
        subject:   payload.subject,
        inputs:    payload.inputs,
        equipment: payload.equipment,
        action:    payload.action,
        result:    parsedResult,
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return apiError('Failed to save experiment', 500)
    }

    return NextResponse.json({ 
      experimentId: experiment?.id, 
      result: parsedResult 
    })

  } catch (err) {
    console.error('[/api/lab/react] Gemini API Error:', err)
    
    // Handle specific Gemini errors
    if (err instanceof Error) {
      if (err.message.includes('SAFETY')) {
        return apiError('Content filtered by safety settings', 400)
      }
      if (err.message.includes('QUOTA_EXCEEDED')) {
        return apiError('API quota exceeded. Please try again later.', 429)
      }
      if (err.message.includes('INVALID_ARGUMENT')) {
        return apiError('Invalid request parameters', 400)
      }
    }
    
    return apiError('AI processing failed', 500)
  }
}