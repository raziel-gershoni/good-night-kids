# Good Night Kids

> Turns Jewish sacred texts and the weekly Torah portion into gentle, age-appropriate AI bedtime stories with narrated Hebrew audio.

![Next.js](https://img.shields.io/badge/Next.js_16-000?style=flat-square&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-C5F74F?style=flat-square&logo=drizzle&logoColor=black)
![Neon Postgres](https://img.shields.io/badge/Neon_Postgres-00E599?style=flat-square&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel&logoColor=white)
[![demo · live](https://img.shields.io/badge/demo-live-2ea44f?style=flat-square)](https://good-night-kids.vercel.app)

**🔗 Live demo:** https://good-night-kids.vercel.app

Good Night Kids is a Hebrew, right-to-left full-stack app for parents. It transforms a passage from the Tanakh, Gemara, Midrash, or Zohar — or the current week's Parashat Hashavua pulled live from Sefaria — into an original children's story, vocalizes it with nikud, and narrates it aloud. The interesting part is the pipeline behind it: multi-provider LLM orchestration, self-correcting structured output, a hand-built long-audio TTS pipeline, and a Hebrew NLP round-trip that survives inline audio tags.

<!-- Screenshot placeholder: leave exactly this HTML comment so the owner can drop an image in later:
     ![screenshot](docs/screenshot.png) -->

## ✨ Features

- **Two authoring flows.** A free-text wizard where you paste any source passage and get back a kids' story plus audio, and a guided Parashat Hashavua wizard that fetches the current weekly portion automatically.
- **Source-aware storytelling.** Choose the source type (Tanakh, Gemara, Midrash, Zohar, or other) so the model treats the text with the right register.
- **Weekly Torah portion, resolved live.** The Parashat Hashavua flow reads the current portion straight from the Sefaria calendar and text APIs — no manual lookup.
- **Automated quality report card.** Every Parasha story is graded by a second LLM pass against explicit editorial rules and returns a status (`ok` / `minor` / `major`) with concrete issues and suggestions.
- **Spoken Hebrew narration.** Stories are read aloud with a choice of TTS engine and voice, over fully vocalized (nikud) text for accurate pronunciation.
- **AI sound design.** A model drafts a short ambient soundscape description, ElevenLabs' sound-generation API turns it into a looping background bed, and optional sound effects are dropped in at the exact moment their trigger phrase is spoken — then mixed under the narration.
- **Swappable AI models and effort controls.** Pick between Claude and Gemini model families and adjust the thinking/effort level directly from the settings bar.
- **Save and share.** Stories and their audio are persisted to Postgres and shareable via a public `/share/<slug>` URL.

## 🏗️ How it works

**Multi-provider LLM orchestration.** Story generation is provider-agnostic: the same request can be routed to Claude (via the Anthropic SDK) or to Gemini (via `@google/genai`), selected by model ID at call time. The UI exposes the model choice alongside an effort level, which is mapped to Claude's adaptive thinking `effort` control and to Gemini's `ThinkingLevel` — so a single abstraction drives two very different provider APIs.

**Self-correcting structured output.** `generateValidatedJson` treats the LLM as an unreliable JSON source and closes the loop around it. It strips markdown fences, parses, and validates the result against a Zod schema. On failure it re-prompts the model with its own previous (bad) output *and* the exact validation errors, asking for a corrected response, retrying up to N times before throwing a typed `JsonValidationError`. This backs the Parasha pipeline's "extract a teachable idea + source verses" and "sanity-check report card" steps, both defined as Zod schemas.

**A multi-step Parasha pipeline.** The guided flow is a chain of discrete, individually inspectable steps: resolve the current portion from Sefaria → extract a teachable idea and its supporting verses → generate an original story (deliberately *not* a retelling) → run an automated report card that checks idea fidelity, structure, age-appropriateness, and audio-tag placement. Each step's prompt is editable, and the intermediate outputs are stored on the record.

**A hand-built long-audio TTS pipeline.** Long single-shot TTS degrades in quality, so the Gemini engine chunks text on paragraph boundaries, greedily merging short paragraphs up to a target size, and renders each chunk sequentially with a per-chunk retry loop. `[pause]` tags are inserted between chunks for natural pacing. Because each chunk comes back as raw headerless PCM, the chunks are concatenated and wrapped in a single, hand-written 44-byte WAV header (RIFF/fmt/data) to produce one valid audio file.

**A Hebrew NLP round-trip that preserves audio tags.** Accurate narration needs nikud (vocalization), added via the Dicta Nakdan API — but the story text contains inline `[audio tags]` that must not be vocalized or lost. Before sending to Dicta, each tag is swapped for an out-of-band Unicode sentinel character (`U+FFF0`); after vocalization the placeholders are restored, and a tag-count check on both ends flags any tag that didn't survive the round-trip. The ElevenLabs path instead requests character-level alignment timestamps and maps a trigger phrase's string position back to timing data (accounting for combining nikud marks) so a generated sound effect can be placed at the exact moment it is spoken.

**Data model.** A single `stories` table (Drizzle + Neon Postgres) stores the original text, the generated story, the TTS script, the audio as a `bytea` column, and typed `jsonb` fields for the extracted Parasha idea, the sanity report, and the per-step prompts — plus a unique short `slug` (nanoid) for public sharing.

## 🛠️ Tech stack

- **Frontend:** Next.js 16 (App Router, React Server Components), React 19, TypeScript, Tailwind CSS v4, Hebrew/RTL layout (`lang="he"`, `dir="rtl"`).
- **Backend / API:** Next.js Route Handlers; generation routes run with `maxDuration = 300` for long-running LLM + TTS work.
- **Data:** Neon serverless Postgres via Drizzle ORM, with SQL migrations and Drizzle Kit; nanoid for share slugs.
- **AI — text:** Anthropic SDK (Claude) and `@google/genai` (Gemini), with Zod-validated structured output.
- **AI — audio & NLP:** Gemini TTS and ElevenLabs TTS (character-level alignment timestamps); ElevenLabs sound-generation for ambient beds and effects; Dicta Nakdan for Hebrew vocalization.
- **External data:** Sefaria API for the weekly Torah portion and its verses.
- **Infra:** Deployed on Vercel.

## 🚀 Getting started

### Prerequisites

- Node.js (with npm)
- A Postgres database (the project targets [Neon](https://neon.tech))
- API keys for Anthropic, Google Gemini, and ElevenLabs

### Environment variables

Create a `.env.local` file with the following (names only — never commit real values):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres (Neon) connection string |
| `ANTHROPIC_API_KEY` | Claude text generation |
| `GEMINI_API_KEY` | Gemini text generation and Gemini TTS |
| `ELEVENLABS_API_KEY` | ElevenLabs narration, sound generation, and word-timing data |

### Install & run

```bash
# install dependencies
npm install

# run database migrations
npm run db:migrate

# start the dev server (http://localhost:3000)
npm run dev

# production build (runs migrations, then builds)
npm run build
npm start
```

Other useful scripts: `npm run db:generate` (generate a migration from the schema), `npm run db:push` (push the schema), `npm run db:studio` (open Drizzle Studio), and `npm run lint`.

## 📦 Deployment

Deployed on Vercel. The `build` script runs pending Drizzle migrations against the database before `next build`, so a deploy keeps the schema in sync. Long-running generation and narration routes declare `maxDuration = 300` to accommodate multi-step LLM and TTS work within Vercel's serverless function limits.

## 📄 License

Shared publicly as a portfolio project.
