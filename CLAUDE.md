# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for Tao Tang (taotang.io), an AI Systems Engineer. Built as a "Personal Conversion System" - designed to convert inbound interest into qualified, paid consulting work with minimal sales overhead.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Environment Setup**: Set `GEMINI_API_KEY` in `.env.local` for any AI features.

## Architecture

**Stack**:
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS (via CDN)
- Backend: Python/FastAPI (planned)
- Database: Supabase (planned)
- Hosting: Render (planned)

**File Structure**:
```
src/
├── main.tsx                      # Entry point
├── App.tsx                       # Root component
├── components/
│   ├── layout/                   # Header, Footer
│   ├── sections/                 # Homepage sections (Hero, Services, etc.)
│   ├── intake/                   # Smart intake form components
│   └── ui/                       # Reusable UI primitives
├── pages/                        # Route-level components
├── lib/                          # API clients (supabase, stripe, etc.)
└── types/                        # Shared TypeScript types

backend/                          # FastAPI backend (to be built)
├── app/
│   ├── main.py
│   ├── routers/
│   ├── models/
│   ├── services/
│   └── schemas/
└── requirements.txt
```

**Page Flow** (order in App.tsx):
1. Header → Hero → Services → AboutSnippet → CaseStudies → Process → InitiateProject → FinalCTA → Footer

**Styling**:
- Tailwind CSS via CDN in `index.html`
- CSS variables in `index.html` (charcoal, off-white, amber scheme)

**Path Alias**: `@/*` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`)

## Design System

Color variables (defined in index.html):
- `--charcoal: #212529` (primary text)
- `--off-white: #F8F9FA` (background)
- `--amber: #FFBF00` (accent/CTA)
- `--deep-amber: #E6AC00` (hover states)
- `--mid-gray: #6C757D` (secondary text)

## Product Philosophy

Per the PRD, this website:
- Prioritizes conversion over traffic/SEO
- Targets non-technical decision makers and technical sponsors
- Offers fixed-scope, productized services
- Filters out misaligned opportunities early

Avoid feature creep - only build what supports conversion, qualification, or clarity.
