// Transcription modes for web app
export type TranscriptionMode = 'text' | 'email' | 'social' | 'translate' | 'command';

export type OutputLanguage = 'en' | 'pt' | 'es';

// Reply styles for Social mode
export type ReplyStyle =
  | 'flirty'
  | 'engaging'
  | 'professional'
  | 'friendly'
  | 'witty'
  | 'assertive'
  | 'supportive';

export interface ReplyStyleOption {
  id: ReplyStyle;
  label: string;
  emoji: string;
  description: string;
  color: string;
}

export interface ModeOption {
  id: TranscriptionMode;
  label: string;
  icon: string;
  description: string;
  color: string;
}

export interface LanguageOption {
  id: OutputLanguage;
  label: string;
  flag: string;
}

export interface GenerateRequest {
  audio: string; // base64
  mode: TranscriptionMode;
  selectedText?: string; // for command mode
  outputLanguage?: OutputLanguage;
  clarifyText?: boolean;
  // Social mode specific
  screenshot?: string; // base64 image
  replyStyle?: ReplyStyle;
}

export interface GenerateResponse {
  success: boolean;
  result?: string;
  transcription?: string;
  error?: string;
}

export interface TranslationResult {
  translation: string;
  fromLanguageName: string;
  fromLanguageCode: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: string;
  mode: TranscriptionMode;
}

export interface Settings {
  apiKey: string;
  outputLanguage: OutputLanguage;
  clarifyText: boolean;
  soundEnabled: boolean;
}

export type RecordingState = 'idle' | 'recording' | 'processing';
