import type { GenerateRequest, GenerateResponse, TranslationResult } from '../types'

const GEMINI_ENDPOINT = (apiKey: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

/** Parse Gemini response parts, filtering out thought parts */
function parseGeminiText(data: unknown): string {
  const parts: Array<{ text?: string; thought?: boolean }> =
    (data as { candidates?: [{ content?: { parts?: [] } }] })
      ?.candidates?.[0]?.content?.parts || []
  const raw = parts.filter(p => !p.thought && p.text).map(p => p.text).join('').trim()
  // strip markdown code fences
  return raw.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim()
}

/** Call 1: Translate pasted text → detect source language */
export async function translateText(
  text: string,
  targetLanguage: string,
  apiKey: string,
): Promise<TranslationResult> {
  const prompt = `Translate the following text to ${targetLanguage}.
Detect the source language.
Respond with valid JSON only — no markdown, no explanation:
{"translation":"<translated text>","fromLanguageName":"<source language in English>","fromLanguageCode":"<ISO 639-1 code>"}

Text:
${text}`

  const response = await fetch(GEMINI_ENDPOINT(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini error ${response.status}`)
  }

  const rawText = parseGeminiText(await response.json())
  return JSON.parse(rawText) as TranslationResult
}

/** Call 2: Transcribe voice reply and translate to target language */
export async function translateAudio(
  audioBase64: string,
  targetLanguageName: string,
  apiKey: string,
): Promise<string> {
  const systemInstruction = `You are a professional translator.
Transcribe the audio and immediately translate it to ${targetLanguageName}.
Output ONLY the translated text in ${targetLanguageName}. No greeting, no explanation, no original text.`

  const response = await fetch(GEMINI_ENDPOINT(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{
        parts: [
          { text: `Translate this audio to ${targetLanguageName}:` },
          { inline_data: { mime_type: 'audio/webm', data: audioBase64 } },
        ],
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error((err as { error?: { message?: string } })?.error?.message || `Gemini error ${response.status}`)
  }

  return parseGeminiText(await response.json())
}



// In production (Vercel), use the serverless function
// In development, call Gemini directly if user has an API key
const API_URL = import.meta.env.PROD ? '/api/generate' : 'http://localhost:3001/api/generate'

// Speech cleanup + mode prompts (mirrored from api/generate.ts for direct calls)
const speechCleanupRules = `
SPEECH CLEANUP (CRITICAL):
Remove all speech disfluencies: "uh", "um", "ah", "er", "hmm", filler sounds, false starts,
repetitions, stutters. Use only the final corrected version.
`

const modePrompts: Record<string, { prompt: string; temperature: number; maxTokens: number }> = {
  text: {
    prompt: `You are an intelligent transcription assistant. The user is dictating text by voice.\n${speechCleanupRules}\nTranscribe into clean, well-formatted text. Fix grammar and punctuation. Return ONLY the final text.`,
    temperature: 0.3, maxTokens: 2048,
  },
  email: {
    prompt: `You are an assistant specialized in professional email formatting.\n${speechCleanupRules}\nFormat as a professional email. Fix grammar/spelling. Don't invent subjects or sign-offs not stated. Return ONLY the email body.`,
    temperature: 0.2, maxTokens: 2048,
  },
  command: {
    prompt: `You are a text transformation assistant. The user provides selected text and a voice command.\n${speechCleanupRules}\nTransform the text per the command. Return ONLY the transformed text.`,
    temperature: 0.3, maxTokens: 4096,
  },
  social: {
    prompt: `You are a social conversation coach helping craft the perfect reply.\n${speechCleanupRules}\nAnalyze the conversation and generate a natural, human-sounding reply. Return ONLY the reply text.`,
    temperature: 0.7, maxTokens: 1024,
  },
}

async function callGeminiDirect(request: GenerateRequest, apiKey: string): Promise<GenerateResponse> {
  const modeConfig = modePrompts[request.mode] || modePrompts.text

  const langName = request.outputLanguage === 'pt' ? 'Portuguese'
    : request.outputLanguage === 'es' ? 'Spanish'
      : 'English'

  const systemPrompt = modeConfig.prompt +
    `\n\nOUTPUT LANGUAGE (CRITICAL):
You MUST output the result in ${langName}.
The user may speak in ANY language, but your response MUST ALWAYS be in ${langName}.
Translate naturally and professionally if the input is in a different language.
This rule overrides everything else. NO EXCEPTIONS.`

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

  // Add screenshot for social mode
  if (request.mode === 'social' && request.screenshot) {
    parts.push({ inlineData: { mimeType: 'image/png', data: request.screenshot } })
  }

  // Add audio
  parts.push({ inlineData: { mimeType: 'audio/webm', data: request.audio } })

  // Add instruction
  if (request.mode === 'command' && request.selectedText) {
    parts.push({ text: `[SELECTED TEXT]\n${request.selectedText}\n\nTransform this text according to my voice command.` })
  } else {
    parts.push({ text: 'Transcribe and format my voice input according to your instructions.' })
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts }],
        generationConfig: {
          temperature: modeConfig.temperature,
          maxOutputTokens: modeConfig.maxTokens,
          thinkingConfig: { thinkingBudget: 0 }, // disable thinking step → faster response
        },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error?.message || `Gemini API error ${response.status}`)
  }

  const data = await response.json()

  // Filter out thought parts (gemini-2.5 may include them), take only real text parts
  const responseParts: Array<{ text?: string; thought?: boolean }> =
    data.candidates?.[0]?.content?.parts || []
  const rawText = responseParts
    .filter(p => !p.thought && p.text)
    .map(p => p.text)
    .join('')

  // Post-processing (mirrors the iOS app client-side cleanup):
  // 1. Strip markdown code fences (```language ... ```)
  // 2. Strip common LLM greeting artifacts
  const cleanText = rawText
    .replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '')  // strip code fences
    .replace(/^(Olá!?\s*|Claro!?\s*|Sure!?\s*|Here is:?\s*|Here's:?\s*)/i, '') // strip greetings
    .trim()

  return { success: true, result: cleanText }
}

export async function generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
  const userApiKey = localStorage.getItem('vibeflow-apikey')

  // In development (no backend), call Gemini directly if user has an API key
  if (!import.meta.env.PROD && userApiKey) {
    try {
      return await callGeminiDirect(request, userApiKey)
    } catch (error) {
      console.error('Direct Gemini call failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to call Gemini API',
      }
    }
  }

  // Production: use backend serverless function
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userApiKey ? { 'X-API-Key': userApiKey } : {}),
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to transcribe',
    }
  }
}
