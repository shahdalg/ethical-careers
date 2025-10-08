## Quick context

This repository is a small Next.js (app router) site written in TypeScript. Key technologies: Next.js v15, React 19, TypeScript, Tailwind (v4) and next/font for Google fonts. The app lives under `src/app` (App Router). There are no API routes, no database integrations, and static assets sit under `public/`.

## How to run (commands discovered in `package.json`)

- Development: `npm run dev` — runs `next dev --turbopack` (Turbopack dev server).
- Build: `npm run build` — runs `next build --turbopack`.
- Start: `npm start` — runs `next start` for the production server.

If you need to add scripts, prefer adding them to `package.json` and keep the existing turbopack flags unless you intentionally change the bundler.

## Files to inspect first (high value)

- `package.json` — scripts and core dependency versions (React 19, Next 15).
- `tsconfig.json` — strict TypeScript settings and the `@/*` path alias (maps to `./src/*`).
- `src/app/layout.tsx` — global layout, font loading via `next/font/google` (Geist + Geist_Mono), and global `metadata` usage.
- `src/app/globals.css` — Tailwind entry (`@import "tailwindcss"`) and CSS custom properties for light/dark themes.
- `src/app/page.tsx` and `src/app/about/page.tsx` — example pages and current content; `about/page.tsx` is a placeholder with just `hi`.
- `public/` — static SVGs used by pages.

## Project patterns and conventions (explicit)

- App Router: source files live in `src/app`. Components placed under `src/app` are Server Components by default. If a component must run on the client, add the `'use client'` directive at the top.
- Metadata: top-level pages/layouts may export `export const metadata = { ... }` (see `layout.tsx`). Update layout metadata for site-wide changes.
- Font variables: layout uses `Geist()` and `Geist_Mono()` from `next/font/google` and attaches CSS variables on `body` (`--font-geist-sans`, `--font-geist-mono`). Preserve these variables when editing `layout.tsx` or global styles.
- Styling: `globals.css` is the single global stylesheet. It imports Tailwind and declares CSS variables for theming. Dark mode is implemented via `@media (prefers-color-scheme: dark)` toggling the same variables.
- Links: the home page (`src/app/page.tsx`) uses plain `<a href="/...">` anchors for navigation. When adding simple static links, it's fine to follow this pattern; be mindful that the project currently doesn't import `next/link` anywhere.
- Import paths: use the `@/` alias where convenient (configured in `tsconfig.json`).

## What to avoid / non-existent patterns

- There are no API routes, server functions, or database configs to rely on. If you add integrations, also add documentation and environment-variable handling.
- There are no test runners or CI config files in the repository; don't assume test infra exists.

## Quick examples (concrete references)

- To change the site font or metadata, edit `src/app/layout.tsx` — it loads fonts and sets `metadata`.
- To add a new route, create a new directory and `page.tsx` under `src/app` (App Router). Example: `src/app/careers/page.tsx` already exists as a page entry.

## Agent guidelines (how you, an AI coding agent, should behave here)

- Make minimal, focused edits. This is a small static site — prefer small PRs that change one concern (layout, page content, new page).
- Preserve TypeScript strictness and existing tsconfig options (e.g., `noEmit: true`).
- Keep styling changes scoped to `globals.css` or new component-level CSS; avoid wholesale rewrites of Tailwind configuration unless explicitly requested.
- When adding client components, include the `'use client'` directive at the top of the file.

## Where things are likely missing or TODOs an agent can safely address

- Replace placeholder text in `src/app/about/page.tsx` (currently just `hi`) with structured content.
- Add basic navigation component under `src/app/components/` and wire into `layout.tsx` if cross-page navigation is needed.

---

If any of these sections are unclear or you'd like the file to include stricter rules (for example: preferred import ordering, linting rules, or CI steps), tell me which part to expand and I will iterate.
