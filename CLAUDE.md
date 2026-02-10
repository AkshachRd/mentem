# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start dev server with Turbopack on port 4250
npm run build        # Build Next.js for production (static export)
npm run lint         # ESLint with auto-fix
npm run tauri dev    # Run full Tauri desktop app (builds frontend + Rust backend)
npm run tauri build  # Build production Tauri app
```

For Rust backend changes:
```bash
cd src-tauri
cargo build          # Build Rust backend
cargo check          # Type-check without building
```

## Architecture Overview

This is a **Tauri + Next.js** desktop app following **Feature-Sliced Design (FSD)**.

### Dual Directory Structure

- **`app/`** - Next.js App Router pages (thin wrappers that re-export from `src/pages/`)
- **`src/`** - FSD-organized source code

### FSD Layer Hierarchy (strict import rules enforced by ESLint)

```
app → pages → widgets → features → entities → shared
```

Each layer can only import from layers below it:

| Layer | Path | Purpose |
|-------|------|---------|
| **shared** | `@/shared/*` | UI components, utilities, config, AI SDK setup |
| **entities** | `@/entities/*` | Business entities: `card`, `tag`, `memory`, `ai`, `settings` |
| **features** | `@/features/*` | Business logic (currently minimal) |
| **widgets** | `@/widgets/*` | Composite UI: `navbar` |
| **pages** | `@/pages/*` | Page components: `home`, `learn`, `research`, `reading`, `error` |
| **app** | `@/app/*` | Providers, global layout, error boundary |

### Entity Structure Pattern

Each entity follows this structure:
```
src/entities/{entity}/
├── index.ts          # Public API exports
├── model/
│   ├── store.ts      # Zustand store
│   └── types.ts      # TypeScript types
├── lib/
│   ├── serialize.ts  # Markdown serialization
│   └── parse.ts      # Markdown parsing (if applicable)
└── ui/               # Entity-specific components
```

### Frontend-Backend Bridge

The Tauri backend (`src-tauri/src/lib.rs`) exposes filesystem commands:
- `fs_any_write_text_file`, `fs_any_read_text_file`, `fs_any_read_binary_file`
- `fs_any_mkdir`, `fs_any_remove`, `fs_any_exists`, `fs_any_read_dir`

Frontend wrapper in `@/shared/lib/fs/index.ts` provides typed access to these commands.

### Data Persistence

- Data stored as markdown files in user's filesystem
- Collections: `memories/`, `cards/`, `tags/` directories
- Zustand stores sync state with filesystem via serialization helpers
- Settings store controls data destination directory

### State Management

Zustand stores per entity:
- `useMemoriesStore` - Notes and memories
- `useCardStore` - Flashcards
- `useTagsStore` - Tags
- `useSettingsStore` - App settings

### AI Integration

- Uses Vercel AI SDK (`ai`, `@ai-sdk/react`)
- OpenRouter provider for LLM access (DeepSeek models)
- Streaming responses for questions and tag generation
- System prompts in `@/entities/ai/lib/prompts.ts` and `@/shared/ai/prompts.ts`

### Key Configuration

- Static export mode (`output: 'export'`) for Tauri compatibility
- No server-side API routes (pure SSG)
- Deep link support via `mentem://` protocol
- Path aliases configured in `tsconfig.json`

## Import Rules

Never use direct `src/*` imports. Always use FSD layer aliases:
```typescript
// ❌ Wrong
import { something } from 'src/entities/card';
import { something } from '../../../entities/card';

// ✅ Correct  
import { something } from '@/entities/card';
```

Cross-slice imports within entities use `@x` pattern:
```typescript
// src/entities/tag/@x/card.ts - exports tag utilities for card entity
```
