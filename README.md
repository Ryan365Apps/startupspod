# Startups Pod Transcript Scraper

A full-stack application to scrape, store, and search YouTube video transcripts from the [@startupspod](https://www.youtube.com/@startupspod) channel.

## Features

- **Video Sync**: Fetch all videos from the Startups Pod YouTube channel
- **Transcript Scraping**: Automatically extract transcripts from YouTube videos
- **Full-Text Search**: Search across all transcripts with highlighted results
- **Theme Extraction**: Automatically identify topics and themes from transcripts
- **Timestamped Navigation**: Click timestamps to jump to specific moments in videos

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express
- **Database**: SQLite with FTS5 full-text search
- **YouTube**: youtubei.js for channel data, youtube-transcript for transcripts

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
# Install all dependencies
npm run install:all
```

### Running the App

```bash
# Start both frontend and backend in development mode
npm run dev
```

Or run them separately:

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Usage

1. **Sync Videos**: Click "Sync Videos from Channel" to fetch video metadata from the Startups Pod channel
2. **Fetch Transcripts**: Click "Fetch All Transcripts" to download transcripts (or fetch individually on video pages)
3. **Search**: Use the Search page to find specific topics across all transcripts
4. **Explore Themes**: Visit the Themes page to see commonly discussed topics

## API Endpoints

### Videos
- `GET /api/videos` - List all stored videos
- `GET /api/videos/:id` - Get video details
- `POST /api/videos/fetch-channel` - Fetch videos from YouTube channel

### Transcripts
- `GET /api/transcripts/:videoId` - Get transcript for a video
- `POST /api/transcripts/:videoId/fetch` - Fetch and store transcript from YouTube
- `POST /api/transcripts/fetch-all` - Batch fetch transcripts for all videos

### Search
- `GET /api/search?q=query` - Search across all transcripts
- `GET /api/search/themes` - Get all themes across all videos

## About the Glasp Plugin

This app works independently of the Glasp plugin by using the `youtube-transcript` library to fetch transcripts directly from YouTube's API. However, if a video doesn't have auto-generated captions, you could:

1. Use Glasp to manually create a transcript
2. Copy the transcript text
3. Store it using the API (future enhancement)

## License

MIT
