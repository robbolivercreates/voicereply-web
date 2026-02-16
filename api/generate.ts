// Vercel Edge Function for Gemini API integration
// Voice-to-text transcription with intelligent formatting (like VibeFlow)

import type { VercelRequest, VercelResponse } from '@vercel/node'

interface GenerateRequest {
  audio: string // base64
  mode: string // code, text, email, uxDesign, command, social
  selectedText?: string // for command mode
  outputLanguage?: string // en, pt, es, etc.
  clarifyText?: boolean
  // Social mode specific
  screenshot?: string // base64 image
  replyStyle?: string // flirty, engaging, professional, friendly, witty, assertive, supportive
}

// Speech cleanup rules applied to all modes
const speechCleanupRules = `
SPEECH CLEANUP (CRITICAL):
Remove all speech disfluencies and verbal artifacts:
- Filler sounds: "uh", "um", "ah", "er", "hmm", "hm", "huh", "eh"
- Portuguese fillers: "é...", "então", "tipo", "né", "assim", "bem", "ahn", "éé"
- Verbal pauses: "so...", "well...", "like...", "you know..."
- False starts: "I want to- I need to" → keep only "I need to"
- Repetitions: "the the" → "the", "I I think" → "I think"
- Stutters: "c-can you" → "can you"
- Breath sounds and lip smacks

SELF-CORRECTION HANDLING:
When the user corrects themselves, use ONLY the correction:
- "X, no wait, Y" → Y
- "X, I mean Y" → Y
- "X, actually Y" → Y
- "X, sorry, Y" → Y
- "não, espera" / "quer dizer" / "na verdade" / "desculpa" (Portuguese)
Example: "create function foo, no wait, bar" → function named "bar"

Output ONLY the clean, final intended message.
`

// Reply style descriptions for Social mode
const replyStyleDescriptions: Record<string, string> = {
  flirty: 'Playful banter, light teasing, show interest subtly, romantic undertones',
  engaging: 'Ask follow-up questions, show genuine curiosity, keep the conversation flowing',
  professional: 'Polished and respectful, appropriate for work/LinkedIn, maintain professionalism',
  friendly: 'Warm and casual, like texting a good friend, supportive and easygoing',
  witty: 'Clever wordplay, humor, quick comebacks, playful intelligence',
  assertive: 'Clear and direct, confident without being aggressive, sets boundaries',
  supportive: 'Empathetic, validating feelings, encouraging, caring tone',
}

const modePrompts: Record<string, { prompt: string; temperature: number; maxTokens: number }> = {
  text: {
    prompt: `You are an intelligent transcription assistant. The user is dictating text by voice.

${speechCleanupRules}

STRICT RULES:
1. Transcribe the audio into clean, well-formatted text
2. NEVER greet or say "hello", "here is", "sure"
3. Fix grammar, punctuation and structure
4. Maintain the original meaning and intent
5. Use paragraphs when appropriate
6. Return ONLY the final text, no explanations`,
    temperature: 0.3,
    maxTokens: 2048,
  },

  email: {
    prompt: `You are an assistant specialized in professional email formatting. The user is dictating email content in natural language.

${speechCleanupRules}

STRICT RULES:
1. Format the text as a well-structured professional email
2. Automatically fix grammar, spelling and punctuation
3. NEVER invent information the user didn't say
4. NEVER add subjects that weren't mentioned
5. Maintain the user's original tone and intent
6. Structure in clear paragraphs when appropriate
7. DON'T add generic greetings if user started directly
8. DON'T add automatic sign-offs - only if user indicated
9. Preserve proper names, dates, numbers exactly as spoken

FORMATTING EXAMPLES:
- "dear mr john I came to talk about the proposal" → "Dear Mr. John,\\n\\nI came to talk about the proposal..."
- "thank you in advance sincerely maria" → "Thank you in advance.\\n\\nSincerely,\\nMaria"`,
    temperature: 0.2,
    maxTokens: 2048,
  },

  command: {
    prompt: `You are a text transformation assistant. The user will provide:
1. Selected text (marked as [SELECTED TEXT])
2. A voice command describing how to transform it

${speechCleanupRules}

COMMON COMMANDS AND RESPONSES:
- "make it professional" → Rewrite in formal business tone
- "make it friendly" → Rewrite in casual, friendly tone
- "summarize" → Create concise summary
- "expand" → Add more detail and context
- "fix grammar" → Fix grammar and spelling only
- "simplify" → Use simpler words and shorter sentences
- "make it shorter" → Reduce length while keeping meaning
- "translate to X" → Translate to specified language

STRICT RULES:
1. Return ONLY the transformed text
2. NEVER include explanations, introductions, or commentary
3. NEVER say "Here is", "Sure", "Okay" or similar
4. Preserve the original meaning unless translation is requested
5. If no selected text is provided, just transcribe the voice command as text`,
    temperature: 0.3,
    maxTokens: 4096,
  },

  social: {
    prompt: `You are a social conversation coach. The user shows you a screenshot of a conversation (WhatsApp, Tinder, Instagram, LinkedIn, etc.) and wants help crafting the perfect reply.

${speechCleanupRules}

YOUR TASK:
1. ANALYZE the conversation in the screenshot:
   - Understand the context and apparent relationship
   - Note the tone being used by the other person
   - Identify what kind of response would be most effective
   - Consider the platform (dating app vs work vs friends)

2. GENERATE a reply that matches the user's requested style

3. INCORPORATE any specific instructions from the user's voice input

STRICT RULES:
1. Output ONLY the suggested reply text - nothing else
2. Keep it natural and human-sounding
3. Match the conversation's existing energy level
4. Don't be cringe or try too hard
5. Consider cultural context if visible in the screenshot
6. NEVER say "Here is your reply" or add commentary
7. Keep replies concise - social messages are typically short
8. If the user speaks additional context/instructions, incorporate them`,
    temperature: 0.7,
    maxTokens: 1024,
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { audio, mode, selectedText, outputLanguage, clarifyText, screenshot, replyStyle } = req.body as GenerateRequest

    if (!audio) {
      return res.status(400).json({ error: 'Audio is required' })
    }

    // Get API key - user's key takes priority, then fall back to env
    const apiKey = req.headers['x-api-key'] as string || process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key required. Please set your Gemini API key in Settings.',
      })
    }

    // Get mode config
    const modeConfig = modePrompts[mode] || modePrompts.text

    // Build the system prompt
    let systemPrompt = modeConfig.prompt

    // For social mode, add the reply style
    if (mode === 'social' && replyStyle) {
      const styleDescription = replyStyleDescriptions[replyStyle] || replyStyleDescriptions.friendly
      systemPrompt += `

REPLY STYLE: ${replyStyle.toUpperCase()}
${styleDescription}

Generate a reply that embodies this style perfectly.`
    }

    // Add clarity instructions if enabled
    if (clarifyText) {
      systemPrompt += `

CLARITY AND ORGANIZATION:
- Reorganize confusing sentences to be clear and logical
- Fix agreement and grammar errors
- Remove unnecessary repetitions
- Structure text cohesively
- If speech is confusing, interpret the intent and write clearly`
    }

    // Add output language instruction
    const langName = outputLanguage === 'pt' ? 'Portuguese' : outputLanguage === 'es' ? 'Spanish' : 'English'
    systemPrompt += `

OUTPUT LANGUAGE (CRITICAL):
You MUST output the result in ${langName}.
The user may speak in any language, but your response MUST be in ${langName}.
Translate naturally and professionally if the input is in a different language.`

    // Build content parts for Gemini
    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = []

    // For social mode, add the screenshot first (if provided)
    if (mode === 'social' && screenshot) {
      // Detect image type from base64 header or default to PNG
      let mimeType = 'image/png'
      if (screenshot.startsWith('/9j/')) {
        mimeType = 'image/jpeg'
      } else if (screenshot.startsWith('R0lGOD')) {
        mimeType = 'image/gif'
      }

      parts.push({
        inlineData: {
          mimeType,
          data: screenshot,
        },
      })
    }

    // Add audio
    parts.push({
      inlineData: {
        mimeType: 'audio/webm',
        data: audio,
      },
    })

    // Add instruction based on mode
    if (mode === 'social') {
      if (screenshot) {
        parts.push({
          text: 'Analyze the conversation in the screenshot above. The audio contains my thoughts or specific instructions for the reply. Generate the perfect response based on the requested style.',
        })
      } else {
        parts.push({
          text: 'The user wants help with a social reply. Listen to their voice input and help craft a response. If they describe a conversation, generate an appropriate reply.',
        })
      }
    } else if (mode === 'command' && selectedText) {
      parts.push({
        text: `[SELECTED TEXT]
${selectedText}

Transform this text according to my voice command.`,
      })
    } else {
      parts.push({
        text: 'Transcribe and format my voice input according to your instructions.',
      })
    }

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            temperature: modeConfig.temperature,
            maxOutputTokens: modeConfig.maxTokens,
          },
        }),
      }
    )

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}))
      console.error('Gemini API error:', errorData)
      return res.status(500).json({
        error: errorData.error?.message || 'Failed to generate response',
      })
    }

    const data = await geminiResponse.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return res.status(200).json({
      success: true,
      result: text.trim(),
    })
  } catch (error) {
    console.error('Handler error:', error)
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}
