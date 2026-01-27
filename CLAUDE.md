# DriveLearn – Claude Code Instructions

You are working on **DriveLearn**, a mobile-first learning app designed for people learning on the go, especially during commutes. The app is built with **Expo (React Native)** and uses **Supabase** as the backend.

This repository is being actively migrated from a web-based prototype (partially generated with Lovable) into a **production-quality Expo mobile app**.

---

## Core Product Vision

DriveLearn enables users to learn anything hands-free using voice.

Primary use case:
- College students learning during commutes (driving, walking, transit)
- Zero typing after onboarding
- Fully voice-driven interaction

Users:
- Log in once
- Add **Topics** (not classes)
- Topics can be created from:
  - Uploaded notes (PDFs, images)
  - Text
  - YouTube links (via transcript extraction)

The system generates questions from the content, speaks them aloud, listens to spoken answers, evaluates correctness, and adapts future questions using spaced repetition.

---

## Key Differentiator (Moat)

**Commute-native learning**.

Unlike general-purpose AI voice assistants:
- DriveLearn is stateful
- Progress-aware
- Context-aware (user is likely not looking at the screen)
- Optimized for short, repeated, voice-only sessions

Voice is not a novelty — it is the primary interface.

---

## UX & Design Principles

- Extremely low friction
- One primary action per screen
- Minimal text
- No mandatory typing after onboarding
- Sessions should auto-start and auto-save

### Home Screen
- A single interactive character (the “Honk” or a cute yellow stingray)
- Acts as the main CTA: “Tap to Start Learning”
- Gentle idle animation

Use a **simple yellow sphere placeholder** for now (similar to calmi.so).

---

## Navigation

Bottom tab layout (Instagram-style):
1. Home – character / tap to start
2. Topics – list of topics
3. Progress – mastery visualization
4. Profile (minimal)

Users should also be able to navigate **entirely by voice**:
- “Start learning”
- “Continue Biology”
- “Switch topic to Econ”
- “Show my progress”
- “Repeat”
- “Make it easier”

---

## Progress System: T-Shaped Knowledge

Progress is visualized using a **T-shaped knowledge model**:
- Horizontal line = breadth across major topic areas
- Vertical downward spikes = depth of mastery in subtopics
- Spike depth increases with accuracy, confidence, and recency

Avoid percentages where possible — prioritize intuitive visual understanding.

---

## Technical Guidelines

### Stack
- Expo SDK 54+
- Yarn only (do NOT use npm)
- Supabase for auth, storage, and data
- Voice:
  - Speech-to-text
  - Text-to-speech
- YouTube transcript extraction using a headless browser

### Expo Rules
- Use `npx expo` commands only
- Keep dependencies aligned with the Expo SDK
- Prefer Expo-managed APIs over bare React Native libraries

---

## Website & Growth

A marketing website should be built **similar to calmi.so**:
- Simple, calming landing page
- Clear value proposition
- Direct App Store / Play Store download links
- No clutter

Track:
- Page views
- App downloads
- Conversion funnel

Use **PostHog** for analytics and UTM tracking.

---

## What Claude Should Help With

- Fixing dependency conflicts (Yarn-only)
- Migrating web logic into Expo
- Designing clean, minimal UI components
- Implementing voice-first flows
- Structuring Supabase schemas for learning progress
- Avoiding overengineering

When unsure, default to:
**simpler, calmer, fewer clicks, more voice**.
