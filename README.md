# VoiceReply 🎤✨

Transform screenshots and voice into perfect responses. Screenshot a message, speak your thoughts, get a polished reply.

## Features

- 📸 **Screenshot Input** - Paste, drag & drop, or capture screen
- 🎤 **Voice Recording** - Hold to speak, release to send
- 🎨 **Response Styles** - Professional, Casual, Technical, Email, Chat, etc.
- 📋 **Auto-Copy** - Responses automatically copied to clipboard
- 📱 **PWA** - Install on any device, works offline
- 🔒 **Secure** - API key stored locally, never sent to third parties

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your Gemini API key to .env.local

# Start development server
npm run dev
```

### Production (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add environment variable: `GEMINI_API_KEY`
4. Deploy!

## Usage

1. **Add Screenshot (Optional)** - Paste (Cmd+V), drag & drop, or capture
2. **Select Style** - Choose how you want the response to sound
3. **Hold to Speak** - Hold the mic button and describe what you want to say
4. **Copy & Paste** - Response is auto-copied, just paste it!

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **PWA**: vite-plugin-pwa
- **AI**: Google Gemini 2.0 Flash
- **Hosting**: Vercel

## API Key

Get your free Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

You can either:
1. Set `GEMINI_API_KEY` as an environment variable (Vercel)
2. Enter it in Settings within the app (stored locally)

## License

MIT

---

Part of the VibeFlow family 💜
