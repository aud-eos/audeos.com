# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Package manager: pnpm** (pinned via the `packageManager` field in `package.json`; pnpm switches to that version automatically). Node comes from `.nvmrc`, which [mise](https://mise.jdx.dev) reads when you `cd` into the repo. pnpm settings — the 7-day `minimumReleaseAge`, security `overrides` and the `allowBuilds` install-script allowlist — live in `pnpm-workspace.yaml`. CI installs with `pnpm/action-setup` and `pnpm install --frozen-lockfile`.

**Do not start the dev server** — the user typically runs `pnpm dev` themselves in a separate terminal. Never launch it from Claude Code.

```bash
pnpm dev          # Start development server
make build        # Build for production (reads .env; postbuild runs next-sitemap automatically)
pnpm test         # Run tests (Vitest)
pnpm test:watch   # Vitest in watch mode
pnpm lint         # ESLint + TypeScript typecheck
pnpm typecheck    # TypeScript only
pnpm format       # ESLint with auto-fix
```

Dependency management (Makefile):

```bash
make upgrade         # pnpm update --interactive --latest (pick updates from a table)
make upgrade-latest  # pnpm update --latest (bumps all direct dependencies to latest, including majors)
make audit           # pnpm audit
```

Content model changes are made in Contentful (via the Contentful MCP, after showing the owner the proposed change), followed by `make types`.

Contentful asset management (Makefile):

```bash
make upload-images DIR="/path/to/dir"         # Upload all media in a directory to Contentful
make upload-images DIR="/path/to/image.jpg"   # Upload a single image to Contentful
make upload-images DIR="/path/to/video.mov"   # Upload a single video to Contentful
```

Supports images (.jpg, .jpeg, .png, .gif, .webp) and videos (.mov, .mp4, .webm). Outputs a JSON array of `{ filename, assetId, url }` to stdout. Reads credentials from `.env` automatically. Always rename files to descriptive filenames before uploading.

Tag migrations (Makefile):

```bash
make migrate-tags PLAN="scripts/migrations/2026-05-14-tag-cleanup.json"
```

Applies a tag migration plan: adds/removes tags on entries, republishes the modified entries, and optionally deletes tags afterward. Plan format defined by `scripts/migrate-tags.mjs` — each entry in `updates` lists `tagsToAdd` (concatenated to existing) and `tagsToRemove` (filtered out); top-level `tagDeletions` removes the listed tag IDs from the space. Bypasses the Contentful MCP's 5-entries-per-mutation cap by using the management SDK directly. Use for bulk taxonomy changes; check plan into `scripts/migrations/` for audit trail.

Blog post creation (Claude Code skill):

```bash
/new-post                    # Brainstorm mode: develop topic, outline, and draft collaboratively
/new-post "My Post Title"    # Assembly mode: content ready, collect fields and create entry
```

Walks through content creation, image upload, SEO check, and Contentful entry creation. See `.claude/skills/new-post/SKILL.md` for the full workflow.

The build output goes to `dist/` (not `.next/`). Feeds (RSS/Atom/JSON) are generated at build time into `public/`.

## Code style

- Use `pnpm format` as the project formatter (ESLint with auto-fix); follow it with `pnpm test` to confirm nothing is broken.
- Enforce required environment variables at module scope using `import { strict as assert } from "assert"` followed by `assert( !!VAR )`. This ensures the build fails immediately if a variable is missing. See `src/utils/contentfulUtils.ts` for the canonical example. Never defer these checks to function-level.

## Architecture

**Static blog site** built with Next.js (`output: "export"`), deployed to GitHub Pages. Content is managed in Contentful CMS; there is no server or database at runtime.

### Data flow

- `src/utils/contentfulUtils.ts` wraps the Contentful SDK — all CMS access goes through `getBlogPosts()`, `getBlogPost(slug)`, `getTags()`, `getAuthors()`, `getAuthor(slug)`, `getCategoryLandings()` and `getHomePages()`. `loadSiteContent()` in `src/lib/siteContent.ts` is the one validated load per build.
- Pages use `getStaticProps` to fetch content at build time. No client-side data fetching from Contentful.
- Search (`src/pages/search.tsx`) is fully client-side using Fuse.js — all posts are embedded in the page as props and searched in-browser.
- Spotify integration (`src/utils/spotify/`) fetches data at build time and is embedded statically. Playlist JSON is cached in `data/spotify/{playlistId}.json` (committed to git). On build, only the lightweight `snapshot_id` is fetched from Spotify — the full playlist is only re-fetched when the snapshot changes. API calls use `retryRequest` with exponential backoff to handle 429 rate limits.
- Feeds are generated in `src/lib/generateFeeds.ts` and called from `getStaticProps` in `src/pages/index.tsx`.
- **Editorial copy lives on categories, not tags.** Category search descriptions, intros, packages, booking links and footnotes live in Contentful `categoryLanding` entries (one per category, validated at build by `src/lib/siteContent.ts`). The home page's lines, live-line switch, hire label, title and meta description live in the single `homePage` entry. Category titles stay the `CATEGORY_TITLES` constant because client-rendered UI needs them. Tag pages render generic SEO (e.g. `Posts tagged {id} | Audeos.com`) by design. The per-tag JSON config (`data/tags.json`, `src/types/tagConfig.ts`, `src/utils/tagSeoConfig.ts`) was deleted in PR #89 because per-tag editorial copy didn't scale. Do not re-introduce it — if a tag needs prominence, consider whether it should be a category instead.
- **`NowPlayingCard` is intentionally client-only** — it renders on the Music category landing (not the home page) and polls `audeos.fm/api/now-playing/main` via `useEffect` + `fetch`, with no `getStaticProps` involvement. This decouples the static export from `audeos.fm`'s availability and keeps live-stream state out of the build cache. Resist the instinct to migrate it to the build-time fetch pattern used elsewhere; it would break the live behavior.
- **One shared now-playing poller** — `src/components/NowPlaying/nowPlayingStore.ts` is the single client-side poller of `audeos.fm/api/now-playing/main` (a `useSyncExternalStore` store: the poller fetches only while subscribed and the tab is visible, payloads validated by `isNowPlaying`, a failed poll clears the data). `NowPlayingCard`, the top-bar `OnAirWidget` and the home page's optional live line (`LiveLine`) all read it via `useNowPlaying()`; do not add a second `fetch` of that endpoint. The client-only rule above applies to the store.
- **Frame navigation and social links** come from `src/lib/navLinks.ts` and `src/lib/socialLinks.ts`. Category display titles come from `categoryTitleFor()` in `src/utils/categoryTitle.ts`, which throws on an unknown id (a missing category fails the build rather than rendering blank).

### Routing

| Route | File | Notes |
|---|---|---|
| `/` | `pages/index.tsx` | Category-sectioned overview (12 most recent posts per category, so every grid row fills at 2, 3 or 4 columns) with nested CollectionPage JSON-LD; the home stack and hire link come from the `homePage` entry |
| `/search` | `pages/search.tsx` | Client-side Fuse.js search |
| `/post/[slug]` | `pages/post/[slug].tsx` | Individual blog post |
| `/page/[page]` | `pages/page/[page].tsx` | Pagination (chronological archive) |
| `/category/[slug]` | `pages/category/[slug].tsx` | Category landing page (3 categories) |
| `/category/[slug]/page/[page]` | `pages/category/[slug]/page/[page].tsx` | Paginated category listing |
| `/tags/[tagId]` | `pages/tags/[tagId].tsx` | Tag-filtered listing (reachable from per-card tag chips and post pages) |
| `/tags/[tagId]/page/[page]` | `pages/tags/[tagId]/page/[page].tsx` | Paginated tag listing |
| `/author/[slug]` | `pages/author/[slug].tsx` | Author profile page |

### Styling

SCSS modules in `src/styles/`. Each page/component has a corresponding `.module.scss` file. Global styles and tokens in `src/styles/globals.css`.

The site is **dark only** (no `prefers-color-scheme` branches). Design tokens are CSS custom properties in `globals.css`: `--ink`, `--paper`, `--mute`, `--rule`, `--accent`, `--hatch`. Mona Sans is loaded in `_app.tsx` with its `wdth` axis as `--font-mona-sans`.

- **`GiantWord`** (`src/components/GiantWord/`) renders each page's `h1`, fitted by `useFitWidth` so the whole word fills the container width on every screen size; with `stackedLogoOnPhone` (home) phones get the inline `AudeosLogo` instead of the text. `useRouteViewTransition` (`src/lib/`) morphs it between pages via the View Transitions API and is skipped for reduced motion.
- **Category landings:** `src/components/Landing/` holds the `CategoryLanding` dispatcher, `EventsLanding` (price lists via `PriceList`, rental section, footnote, booking link) and `MusicLanding` (player and listening links); they render only on page 1 of a category.
- **Post grids:** `BlogPostList` (home, category, tag and archive pages) is a gapless, edge-to-edge grid of 4:3 image tiles, showing the `--hatch` pattern until each image loads (`useImageLoaded` in `src/lib/`). Each tile's caption is a centered black "stamp" over the image: the title is rendered twice in one grid cell (an `aria-hidden` back copy paints the line boxes, the front copy the text) so tight lines never cover each other, followed by the date and `Tags` with `variant="stamp"` (the active tag on tag pages inverts to a green block). Stamp type is sized in `cqi` against the card's width. **Search results** use masonry `PostCard`s: native `display: grid-lanes` where supported (`@supports` in `Masonry.module.scss`); otherwise `useMasonryPlacement` (`src/components/Masonry/`) places cards, re-placing when the grid width or any card height changes.
- `useRevealOnScroll` (in `BlogPostList.tsx`) fades cards in on scroll and shows all cards at once under reduced motion.
- **Focused card:** `BlogPostList` images rest at 30% opacity over black, and one focused card shows full color and zooms in. `useCardFocus` (`src/components/Home/`) picks that card: with a mouse, the card under the pointer, re-checked on scroll because CSS `:hover` goes stale. On touch, it's the card under a focus line that sits mid-screen and slides toward the edges at the ends of the page, sweeping one card at a time across a row (`cardFocus.ts`). It reads `(hover: hover) and (pointer: fine)` live, and keyboard focus (`:focus-within`) also counts. Don't bring back the CSS `img:hover` zoom or a long-press preview.

### Path aliases

`@/*` maps to `src/*` — use `@/components/...`, `@/utils/...`, etc.

### Contentful type generation

TypeScript types for Contentful content models live in `src/types/contentful/`. Regenerate with:
```bash
make types
```
This first exports the full space to `contentful/export.json` (intermediate file, gitignored), then generates types with JSDoc, type guards, and response variants. Do not run `cf-content-types-generator` directly — it skips the export step and produces a stripped-down format.

## Invariants

These rules must hold across changes to this repo. They encode decisions that aren't visible from any single source file — break them and you'll either ship a security hole or a broken build.

- **Reject and rebuild third-party iframe `src`** — when integrating an oEmbed provider (SoundCloud, YouTube, Vimeo, Mixcloud, etc.), never render the provider's `html` field via React's raw-HTML escape hatch. Instead, parse the iframe `src` out, validate the host against a hardcoded allowlist constant (see `ALLOWED_IFRAME_HOST` in `src/components/SoundCloudEmbed.tsx` and `YouTubeEmbed.tsx`), and render a fresh `<iframe>` with explicit `allow` / `allowFullScreen` attributes. **TikTok is the documented exception**: its `embed.js` hydrates the blockquote, so the oEmbed HTML *is* injected — but `<script>` tags are scrubbed via JSDOM in `src/utils/tiktok/getOembed.ts` before reaching the component, and a fresh script element is appended client-side from `TikTokEmbed.tsx`.
- **Content validation fails the build** — `buildLandingMap` / `buildHomeContent` throw with the category or package named; never add a fallback that renders a page without its content. Linked entries that are unpublished (draft service packages, a missing social image) are intentionally omitted by the delivery API's `withoutUnresolvableLinks` client, so unpublishing a package hides it rather than failing the build.
- **Dynamic routes use `fallback: false`** — Next.js static export does not support `fallback: true` or `'blocking'`. Any `getStaticPaths` over a Contentful content type must guarantee every entry has the field used as the path param populated *before* merging the route. The build error names the missing entry only by opaque sys ID, so the trap is easier to avoid than to debug.

## Environment variables

Required (set in GitHub Actions secrets; create `.env.local` locally):

```
CONTENTFUL_SPACE_ID
CONTENTFUL_ACCESS_TOKEN
CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN
CONTENTFUL_ENVIRONMENT          # default: master
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
```
