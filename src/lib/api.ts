import type { GenerateRequest, GenerateResponse } from '../types'

const API_URL = import.meta.env.PROD ? '/api/generate' : 'http://localhost:3001/api/generate'

export async function generateResponse(request: GenerateRequest): Promise<GenerateResponse> {
  // Check if user has set their own API key
  const userApiKey = localStorage.getItem('vibeflow-apikey')

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
