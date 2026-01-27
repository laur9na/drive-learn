# DriveLearn

DriveLearn is a mobile-first learning app designed for hands-free, voice-driven learning during commutes.

## Project Structure

This monorepo contains two main components:

### 1. Mobile App (`/mobile`)
- Built with **Expo SDK 54** and **React Native**
- Voice-first learning interface
- Supabase backend for auth, storage, and data
- Supports iOS and Android

**Run the mobile app:**
```bash
cd mobile
yarn install
npx expo start
```

### 2. Landing Page (`/website`)
- Built with **Next.js**
- Marketing website for app downloads
- Deployed to Vercel

**Run the landing page:**
```bash
cd website
pnpm install
pnpm dev
```

## Key Features

- Voice-driven question/answer sessions
- Topic-based learning (not classes)
- Content from PDFs, images, text, or YouTube transcripts
- Spaced repetition algorithm
- T-shaped knowledge progress visualization

## Tech Stack

- **Mobile**: Expo 54, React Native, Supabase
- **Website**: Next.js, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Voice**: Speech-to-text, Text-to-speech

## Development Guidelines

- Use **Yarn only** for mobile (not npm)
- Keep UX minimal and voice-first
- One primary action per screen
- See [CLAUDE.md](./CLAUDE.md) for detailed instructions

## Environment Variables

Copy `.env.example` to `.env` in the mobile directory and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-key
```

## Contributing

This is a private project. For questions, contact the maintainer.
