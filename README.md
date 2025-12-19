# Meow Videos 🎬

A YouTube-like video platform powered by Telegram for storage.

## Features

- 📺 Video grid with thumbnails
- ▶️ Video player with controls
- ⬇️ Download functionality
- 🌙 Modern dark theme
- 🚀 Serverless (Vercel-ready)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Telegram credentials

# Start dev server
npm run dev
```

## Admin Commands

```bash
# Upload a video
npm run upload -- --video ./video.mp4 --thumb ./thumb.jpg --title "My Video"

# Sync metadata from Telegram channel
npm run sync
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather |
| `TELEGRAM_CHANNEL_ID` | Private channel ID (e.g., `-100xxxxxxxxxx`) |

## Deployment

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## Tech Stack

- **Frontend**: Next.js 16, React 19
- **Storage**: Telegram (via Bot API)
- **Hosting**: Vercel (serverless)

## Architecture

Videos are stored in a private Telegram channel. The API resolves video IDs to Telegram CDN URLs via 302 redirects, keeping serverless function execution under 1 second.

```
Browser → /api/resolve/:id → Telegram getFile → 302 → Telegram CDN
```

## License

MIT
