# AI Creative Studio & Intelligent Chatbot with SQLite Database

A high-performance AI creative companion and multi-turn conversational studio powered by Google Gemini, backed by a persistent server-side SQLite database. Features intelligent model routing across latency and depth tiers, high-fidelity image generation up to 4K resolution, persona switching, and seamless Thai/English bilingual interaction.

## User Review & Critical Decisions

> [!IMPORTANT]
> The architectural direction has been aligned with your preferences and feature specifications:
> - **Confirmed Persistence**: Server-side SQLite database storing chat threads, message histories, persona configurations, prompt templates, and generated image metadata with full CRUD and search capabilities.
> - **Confirmed Domain & Specialization**: AI Creative Studio combining advanced text reasoning, multimodal brainstorming, and high-resolution generative visuals.
> - **Confirmed Language**: Full Thai (ภาษาไทย) and English bilingual interface with instantaneous language toggling.
> - **Model Routing Matrix**:
>   - Ultra-fast & low-latency tasks: `gemini-3.1-flash-lite`
>   - General conversational & creative drafting: `gemini-3.8-flash`
>   - Complex reasoning, deep logic & coding: `gemini-4-argon`
>   - High-fidelity image generation & editing: `gemini-3-pro-image-preview` with explicit resolution affordance (1K, 2K, 4K)

---

## 1. Overview & Core Concept

- **What It Does**: A comprehensive AI Studio platform where users can hold deep, context-aware conversations with specialized AI roles (e.g., Creative Director, Prompt Engineer, Copywriter, Full-Stack Architect), generate high-resolution studio artwork (1K, 2K, 4K) with configurable aspect ratios, and organize all creative assets, prompts, and knowledge docs in a local server-side SQLite database.
- **Target Audience**: Content creators, designers, developers, and knowledge workers who require rapid low-latency AI assistance alongside heavy reasoning and high-definition generative imagery.
- **Key Value**: Eliminates transient session loss by persistently archiving conversation trees and artwork in SQLite, while providing instant latency adaptability (Flash-Lite for speed, Argon for depth) and crisp studio-grade image synthesis.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Chat & Reasoning Flow**:
   - User launches the studio and selects or creates a chat session in the sidebar.
   - User selects an AI Persona (e.g., "Creative Director", "Coding Specialist", "General Assistant") or writes a custom system instruction.
   - User toggles model tier: Fast / Low-Latency (`gemini-3.1-flash-lite`), Balanced (`gemini-3.8-flash`), or Deep Reasoning (`gemini-4-argon`).
   - User converses in Thai or English with real-time streaming text, markdown formatting, syntax highlighting, and copy/export actions.
2. **Generative Image Studio Flow**:
   - User switches to the "Studio Canvas" mode or types an image prompt in chat.
   - Dedicated resolution picker affordance: **1K** (Standard Studio), **2K** (High-Definition Print), or **4K** (Ultra-High Resolution).
   - Aspect ratio selector: 1:1 (Square), 16:9 (Landscape), 9:16 (Story/Mobile), 4:3 (Card), 3:4 (Editorial Portrait).
   - Generated artwork displays with zoom/pan modal, prompt inspection, generation parameters, download button, and direct option to save to the SQLite gallery.
3. **Database & Knowledge Vault Flow**:
   - User explores saved sessions, bookmark tags, and knowledge records in the Database Explorer panel.
   - Search across message contents, filter by date or persona, and export data as JSON or Markdown.
4. **Bilingual & Theme Experience**:
   - Top-bar toggles for Thai (TH) and English (EN) dynamically translate UI labels, tooltips, placeholders, and preset templates.
   - Fluid light and dark mode with high contrast compliance.

### Visual Identity & Theme
- **Aesthetic Direction**: Sophisticated Dark Slate Creative Studio (graphite surfaces, crisp hairline borders, typography-led minimalism, zero generic AI candy badges).
- **Color Palette & Discipline (60-30-10)**:
  - *60% Neutral Canvas*: Slate `#0B0F17` (Dark) / Off-white `#F8FAFC` (Light).
  - *30% Structural Surfaces*: Subtle cards `#121826` / `#FFFFFF` with hairline borders (`#1E293B` / `#E2E8F0`).
  - *10% Functional Accent*: Electric Indigo (`#6366F1`) & Emerald (`#10B981`) for execution actions, image size indicators, and active states.
- **Typography**:
  - Display & Headings: `Plus Jakarta Sans` with `Prompt` for elegant Thai script integration.
  - Body Prose: `Manrope` / `Sarabun` (15px, 1.6 line-height).
  - Telemetry & Parameters: `JetBrains Mono` with `tabular-nums` for tokens, resolution values, and timestamps.
- **Top Bar Contract**:
  - Zone 1: Wordmark (`StudioAI` / `สตูดิโอเอไอ`)
  - Zone 2: Navigation Links (`Chat Studio`, `Image Lab`, `Database Records`, `Persona Library`)
  - Zone 3: Language Toggle (`TH | EN`) + Theme Toggle + New Session CTA

---

## 3. Key Product Decisions & Trade-Offs

- **Server-Side SQLite via `better-sqlite3`**:
  - *Chosen Approach*: Fast, zero-config, embedded file database managed by the Express backend (`data/studio.db`) with tables for `conversations`, `messages`, `personas`, `images`, and `knowledge_docs`.
  - *Why*: Provides instant queries, full ACID transactions, and zero external cloud credentials or network latency overhead.
  - *Alternative Considered*: Browser `localStorage` was rejected because it cannot reliably handle high-resolution image blobs or multi-session structured search; Firebase was declined per user choice.
- **Strict Server-Side Gemini API Proxy**:
  - *Chosen Approach*: Client communicates strictly via Express backend endpoints (`/api/chat`, `/api/generate-image`, `/api/db/*`).
  - *Why*: Adheres to security rules preventing `process.env.GEMINI_API_KEY` exposure in browser bundles, and enables robust streaming and image chunk processing.
- **Dynamic Model Dispatching**:
  - `gemini-3.1-flash-lite`: For low-latency responses, quick summaries, and instantaneous feedback.
  - `gemini-3.8-flash`: For everyday multi-turn conversations and balanced responses.
  - `gemini-4-argon`: For complex logic, coding, and in-depth analytical reasoning.
  - `gemini-3-pro-image-preview`: Specifically called with `imageConfig: { imageSize: "1K" | "2K" | "4K", aspectRatio }` for the image generation engine.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             REACT FRONTEND (Vite)                           │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────┐  │
│  │     Chat Studio       │ │    Image Generator    │ │  SQLite Explorer  │  │
│  │ (Multi-Turn, Personas,│ │  (1K/2K/4K Resolution│ │  (Sessions, Docs, │  │
│  │  Model Switcher)      │ │   Aspect Ratio, Pan)  │ │   Search & Export)│  │
│  └───────────┬───────────┘ └───────────┬───────────┘ └─────────┬─────────┘  │
│              │                         │                       │            │
│              └─────────────────────────┼───────────────────────┘            │
│                                        ▼                                    │
│                              REST API Client (Fetch)                        │
└────────────────────────────────────────┬────────────────────────────────────┘
                                         │ HTTP / JSON & SSE Streams
┌────────────────────────────────────────▼────────────────────────────────────┐
│                         EXPRESS SERVER (server.ts)                          │
│                                                                             │
│   ┌───────────────────────┐                    ┌─────────────────────────┐  │
│   │   /api/chat           ├──────────┐         │    better-sqlite3       │  │
│   │   (Lite, Flash, Argon)│          │         │    data/studio.db       │  │
│   ├───────────────────────┤          ▼         ├─────────────────────────┤  │
│   │   /api/generate-image │   @google/genai    │  • conversations        │  │
│   │   (gemini-3-pro-image)│   SDK Client       │  • messages             │  │
│   ├───────────────────────┤   (Server-Only)    │  • personas             │  │
│   │   /api/db/*           │                    │  • generated_images     │  │
│   │   (CRUD & Search)     │                    │  • knowledge_items      │  │
│   └───────────────────────┘                    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Database Schema (SQLite)
- `conversations`: `id`, `title`, `persona_id`, `model`, `created_at`, `updated_at`
- `messages`: `id`, `conversation_id`, `role`, `content`, `model_used`, `created_at`
- `personas`: `id`, `name_en`, `name_th`, `system_instruction`, `description_en`, `description_th`, `icon`, `category`
- `generated_images`: `id`, `conversation_id`, `prompt`, `resolution`, `aspect_ratio`, `image_url` (base64/data URI), `created_at`
- `knowledge_items`: `id`, `title`, `content`, `category`, `created_at`

### API Route Endpoints
- `POST /api/chat`: Streams or returns AI response with conversation history and system instructions using requested model (`gemini-3.1-flash-lite`, `gemini-3.8-flash`, `gemini-4-argon`).
- `POST /api/generate-image`: Calls `gemini-3-pro-image-preview` with `imageSize` ("1K", "2K", "4K") and `aspectRatio`, saving the result to SQLite.
- `GET /api/conversations`: Lists all conversations with latest preview and message counts.
- `GET /api/conversations/:id/messages`: Retrieves message history for the active thread.
- `POST /api/conversations`: Creates a new session.
- `DELETE /api/conversations/:id`: Removes a conversation and its messages.
- `GET /api/images`: Lists all generated images with filtering.
- `GET /api/personas`: Lists customizable system personas.
- `POST /api/personas`: Adds or edits custom personas.
- `GET /api/db/export`: Exports the database contents for backup.

---

## 5. Verification & Acceptance Criteria
- [ ] Multi-turn chat maintains full conversation history across refreshes using SQLite.
- [ ] Model selector switches accurately between `gemini-3.1-flash-lite` (fastest), `gemini-3.8-flash` (balanced), and `gemini-4-argon` (deep reasoning).
- [ ] Image generation with `gemini-3-pro-image-preview` allows users to select 1K, 2K, or 4K resolution and preview/download results.
- [ ] Bilingual toggle smoothly switches all UI text between Thai and English.
- [ ] Clean responsive interface conforming to zero-pill, anti-slop, and 60-30-10 color guidelines.
- [ ] Zero build or lint errors on `compile_applet`.
