# Hub redesign PR 1: visual system and site frame — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the redesigned look of audeos.com on every page — dark-only tokens, new top bar with the on-air widget, footer, giant headings, masonry post cards and restyled pagination and post pages — without any Contentful model changes.

**Architecture:** Visual tokens move to CSS custom properties in `globals.css`. New focused components (`GiantWord`, `PostCard`, `OnAirWidget`) and two small hooks (`useMasonryPlacement`, `useFitWidth`) slot into the existing `Layout`, `BlogPostList`, `FilteredArchive`, home and post pages. The now-playing fetch moves into one shared store so the corner widget and the existing card share a single poller. Category titles keep coming from `data/categories.json`; PR 2 replaces that.

**Tech Stack:** Next.js 16 pages router with static export, React 19, TypeScript, SCSS modules, Vitest with Testing Library, `next/font/google` (Mona Sans).

**Spec:** `docs/superpowers/specs/2026-10-11-audeos-hub-redesign-design.md` (PR #150). This plan covers the spec's Delivery item 1 only. PR 2 (content models, home intro, Events and Music layers) and PR 3 (About page, structured data) get their own plans.

## Global Constraints

- Dark mode only: black background, white text, muted white, `lightgreen` as the only accent. No `prefers-color-scheme` branches anywhere in `src`.
- No purple and no gradients in new UI. The existing `NowPlayingCard` keeps its current styling in this PR.
- Fonts: Mona Sans (with its `wdth` axis), the existing system monospace stack, VT323 where already used. No new font families.
- Giant words: Mona Sans weight 900, `font-stretch: 82%`, `letter-spacing: -0.105em`, solid overlaps, plain text in one element, no per-word tweaks.
- Phone: only AUDEOS splits, rendered as the inline logo SVG with `fill="currentColor"`. Every other giant word stays one line and is scaled to the container width.
- Desktop giant words are one line, cropped by `overflow: clip`, never scrolled.
- No sideways scrolling anywhere. The page must never be wider than the viewport.
- Cards show the whole image at its Contentful aspect ratio, a monospace date and category line, and the title. Pagination stays 12 per page with today's URLs.
- No disclosure UI (accordions, details/summary, collapsing menus).
- TypeScript: no `as` assertions; use type guards or `satisfies`. No single-character identifiers. No `eslint-disable`.
- Tests: only behavior nothing else covers, through public interfaces, mocking only network, clock and randomness. Delete tests made redundant.
- All copy is placeholder pending the copy pass; this PR adds no marketing copy.
- Run `yarn format` after every file change; `yarn lint`, `yarn test` and `yarn build` must pass before the PR opens.

## Review Focus

1. **Post with no cover image.** The card must render a hatched 4:3 placeholder and the title, not crash or collapse. Test owned by Task 5.
2. **Cover image with no width or height in Contentful.** The build must fail with an error naming the post slug, not render a zero-height card. Test owned by Task 5.
3. **audeos.fm endpoint down or returning malformed JSON.** The corner widget must still render "audeos.fm" and link to the stream; the payload must be rejected by the type guard, not trusted. Tests owned by Task 2.
4. **Browser with native masonry (`display: grid-lanes`).** The placement script must not touch layout, so Safari's native ordering applies. Test owned by Task 4.
5. **Long word on a narrow phone (LIFESTYLE at 320px).** It must fit the width with no horizontal page scroll. Manual check in Task 11's verification, because jsdom has no layout.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/styles/globals.css` | Modify | Dark-only design tokens, body colors, view-transition rules |
| `src/pages/_app.tsx` | Modify | Mona Sans with `wdth` axis as `--font-mona-sans`; route view transitions |
| `src/constants.ts` | Modify | Reorder `CATEGORY_IDS`; add `AUTHOR_SLUG`, `STREAM_CHANNEL_URL` |
| `src/components/NowPlaying/nowPlayingTypes.ts` | Create | `NowPlaying` types and the `isNowPlaying` guard |
| `src/components/NowPlaying/nowPlayingStore.ts` | Create | Shared poller and `useNowPlaying` hook |
| `src/components/NowPlaying/NowPlayingCard.tsx` | Modify | Use the shared hook instead of its own fetch |
| `src/components/Layout/OnAirWidget.tsx` | Create | Corner on-air link |
| `src/lib/navLinks.ts` | Create | Section links and active-path matching |
| `src/lib/socialLinks.ts` | Create | Social links constant shared by the footer (and PR 3's About page) |
| `src/components/Layout/TopNav.tsx` | Modify | Wordmark, search, section links, on-air widget |
| `src/components/Layout/Footer.tsx` | Modify | Read social links from `src/lib/socialLinks.ts` |
| `src/components/CategoryNav.tsx` | Delete | Replaced by top-bar section links |
| `src/components/Masonry/placeCards.ts` | Create | Pure shortest-column placement |
| `src/components/Masonry/useMasonryPlacement.ts` | Create | Applies placement when native masonry is missing |
| `src/utils/formatCardDate.ts` | Create | `MM.DD.YY` from an ISO date without timezone shift |
| `src/components/PostCard/PostCard.tsx` | Create | One card: image at true ratio, meta line, title |
| `src/components/Home/BlogPostList.tsx` | Modify | Render `PostCard`s in the masonry list |
| `src/components/GiantWord/audeosLogoPath.ts` | Create (generated) | Logo path data |
| `src/components/GiantWord/AudeosLogo.tsx` | Create | Inline logo SVG |
| `src/components/GiantWord/useFitWidth.ts` | Create | Phone fit-to-width sizing |
| `src/components/GiantWord/GiantWord.tsx` | Create | The giant heading |
| `src/components/Home/CategoryPostSections.tsx` | Modify | Section heading, "See all N", "All N" link |
| `src/components/FilteredArchive/FilteredArchive.tsx` | Modify | Giant word on category pages, no `CategoryNav` |
| `src/pages/index.tsx` | Modify | Giant AUDEOS above the sections |
| `src/pages/post/[slug].tsx` | Modify | New post header order |
| `src/lib/useRouteViewTransition.ts` | Create | Wrap client navigations in a view transition |
| `src/utils/categoryTitle.ts` | Create | Category id to title, failing loudly on unknown ids |
| `src/lib/searchTypes.ts`, `src/pages/search.tsx` | Modify | Search index carries card data; results render as cards |
| `src/styles/*.module.scss` | Create/Modify | One module per new component; light-mode branches removed |
| `CLAUDE.md` | Modify | Architecture notes for the new frame |

---

## Setup

- [ ] **Create the implementation worktree** from the repo root:

```bash
git fetch origin
git worktree add -b feat/hub-visual-system ../audeos.com.worktrees/hub-visual-system origin/main
cd ../audeos.com.worktrees/hub-visual-system
yarn install --immutable
yarn test
```

Expected: install succeeds and the existing suite passes before any change. If the spec PR (#150) has not merged yet, copy `docs/superpowers/specs/assets/audeos-logo-clean.svg` from the `docs/hub-redesign-spec` branch with `git checkout origin/docs/hub-redesign-spec -- docs/superpowers/specs/assets/audeos-logo-clean.svg`.

---

### Task 1: Dark-only tokens and Mona Sans width axis

No tests: this is configuration and styling. Verification is a clean build and a grep.

**Files:**
- Modify: `src/styles/globals.css` (whole file)
- Modify: `src/pages/_app.tsx:11-13,34`
- Modify: `src/constants.ts:14`
- Modify: every file listed by `grep -rln prefers-color-scheme src`: `Author.module.scss`, `Playlist.module.scss`, `OldSchoolButton.module.scss`, `Gallery.module.scss`, `Home.module.scss`, `BlogPost.module.scss`, `Tags.module.scss`, `Markdown.module.scss`, `NowPlayingCard.module.scss`, `Layout.module.scss:81`

**Interfaces:**
- Produces: CSS custom properties `--ink`, `--paper`, `--mute`, `--rule`, `--accent`, `--hatch`, `--font-mona-sans`, `--font-mono`. Later tasks use only these names.
- Produces: `CATEGORY_IDS` ordered `[ "events", "music", "lifestyle" ]`.

- [ ] **Step 1: Replace `src/styles/globals.css`** with:

```css
:root {
  --max-width: 1100px;
  --border-radius: 12px;
  --font-mono: ui-monospace, Menlo, Monaco, "Cascadia Mono", "Segoe UI Mono",
    "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro",
    "Fira Mono", "Droid Sans Mono", "Courier New", monospace;

  --ink: #fff;
  --paper: #000;
  --mute: rgba(255, 255, 255, 0.55);
  --rule: rgba(255, 255, 255, 0.16);
  --accent: lightgreen;
  --hatch: repeating-linear-gradient(
    -45deg,
    rgba(255, 255, 255, 0.22) 0 2px,
    transparent 2px 9px
  );

  color-scheme: dark;
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  min-height: 100vh;
  overflow-x: clip;
}

body {
  color: var(--ink);
  background-color: var(--paper);
}

a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

/* View transitions: page crossfade plus the giant word hand-off */
::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 0.3s;
  animation-timing-function: ease-in-out;
}

::view-transition-old(giant-word) {
  animation: giant-word-out 0.35s ease both;
}

::view-transition-new(giant-word) {
  animation: giant-word-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes giant-word-out {
  to { translate: -12% 0; opacity: 0; }
}

@keyframes giant-word-in {
  from { translate: 18% 0; opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root),
  ::view-transition-old(giant-word),
  ::view-transition-new(giant-word) {
    animation: none;
  }
}
```

- [ ] **Step 2: Remove every light-mode branch.** In each file listed under **Files**, delete each `@media (prefers-color-scheme: light) { … }` block entirely. For each `@media (prefers-color-scheme: dark) { … }` block, move its declarations up into the enclosing rule (replacing the light value they overrode) and delete the wrapper. In `src/styles/Layout.module.scss:81` change `background: rgb(var(--background-start-rgb));` to `background: var(--paper);`.

Run: `grep -rn "prefers-color-scheme\|--foreground-rgb\|--background-start-rgb" src`
Expected: no output.

- [ ] **Step 3: Load Mona Sans with its width axis.** In `src/pages/_app.tsx` replace the font setup and wrapper:

```tsx
const fontMonaSans = Mona_Sans({
  subsets: [ "latin" ],
  axes: [ "wdth" ],
  variable: "--font-mona-sans",
});
```

and

```tsx
      <div className={ `${fontMonaSans.className} ${fontMonaSans.variable}` }>
```

- [ ] **Step 4: Reorder categories to the approved nav order.** In `src/constants.ts` set:

```ts
export const CATEGORY_IDS = [ "events", "music", "lifestyle" ] as const;
export const AUTHOR_SLUG = "audeos";
export const STREAM_CHANNEL_URL = `${STREAM_ORIGIN}/channels/main`;
```

Move `STREAM_CHANNEL_URL` below the existing `STREAM_ORIGIN` line so it can reference it.

- [ ] **Step 5: Verify**

Run: `yarn format && yarn lint && yarn test`
Expected: all pass. The `CategoryPostSections` "CATEGORY_IDS order" test reads the constant, so it follows the new order.

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat: dark-only design tokens and Mona Sans width axis"
```

---

### Task 2: Shared now-playing store and the on-air widget

**Files:**
- Create: `src/components/NowPlaying/nowPlayingTypes.ts`
- Create: `src/components/NowPlaying/nowPlayingStore.ts`
- Modify: `src/components/NowPlaying/NowPlayingCard.tsx:23-138` (types and fetch effect)
- Create: `src/components/Layout/OnAirWidget.tsx`
- Create: `src/styles/OnAirWidget.module.scss`
- Test: `src/__tests__/components/nowPlayingTypes.test.ts`, `src/__tests__/components/OnAirWidget.test.tsx`

**Interfaces:**
- Consumes: `STREAM_ORIGIN`, `STREAM_CHANNEL_URL` from `@/constants`.
- Produces: `type NowPlaying`, `function isNowPlaying( value: unknown ): value is NowPlaying`, `interface NowPlayingState { data: NowPlaying | null; errored: boolean }`, `function useNowPlaying(): NowPlayingState`, `export default function OnAirWidget()`.

- [ ] **Step 1: Write the failing guard test** at `src/__tests__/components/nowPlayingTypes.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { isNowPlaying } from "@/components/NowPlaying/nowPlayingTypes";

const validPayload = {
  channel: { slug: "main", name: "Audeos", description: null },
  source: "loop_fallback",
  track: { title: "Slappers", artist: "DJ Audeos", started_at: null, duration_ms: 4636000, position_ms: 3378000 },
  next_track: { title: "Rear Wax (2010)", artist: "DJ Audeos" },
  listener_count: 0,
};

describe( "isNowPlaying", () => {
  it( "accepts a well-formed payload, including a null track", () => {
    expect( isNowPlaying( validPayload ) ).toBe( true );
    expect( isNowPlaying({ ...validPayload, track: null, next_track: null }) ).toBe( true );
  });

  it( "rejects an unknown source", () => {
    expect( isNowPlaying({ ...validPayload, source: "radio" }) ).toBe( false );
  });

  it( "rejects a track without a title", () => {
    expect( isNowPlaying({ ...validPayload, track: { ...validPayload.track, title: 42 } }) ).toBe( false );
  });

  it( "rejects non-object payloads such as an HTML error page parsed as text", () => {
    expect( isNowPlaying( "<html>502</html>" ) ).toBe( false );
    expect( isNowPlaying( null ) ).toBe( false );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/nowPlayingTypes.test.ts`
Expected: FAIL, cannot resolve `@/components/NowPlaying/nowPlayingTypes`.

- [ ] **Step 3: Implement `src/components/NowPlaying/nowPlayingTypes.ts`**

```ts
export type NowPlayingSource = "live" | "scheduled" | "loop_fallback";

export interface NowPlayingTrack {
  title: string;
  artist: string | null;
  started_at: string | null;
  duration_ms: number | null;
  position_ms: number | null;
}

export interface NowPlaying {
  channel: { slug: string; name: string; description: string | null };
  source: NowPlayingSource;
  track: NowPlayingTrack | null;
  next_track: { title: string; artist: string | null } | null;
  listener_count: number;
}

const SOURCES: readonly string[] = [ "live", "scheduled", "loop_fallback" ];

function isRecord( value: unknown ): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString( value: unknown ): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber( value: unknown ): value is number | null {
  return value === null || typeof value === "number";
}

function isTrack( value: unknown ): value is NowPlayingTrack {
  return isRecord( value )
    && typeof value.title === "string"
    && isNullableString( value.artist )
    && isNullableString( value.started_at )
    && isNullableNumber( value.duration_ms )
    && isNullableNumber( value.position_ms );
}

function isNextTrack( value: unknown ): value is NowPlaying["next_track"] {
  return value === null
    || ( isRecord( value ) && typeof value.title === "string" && isNullableString( value.artist ) );
}

export function isNowPlaying( value: unknown ): value is NowPlaying {
  if( !isRecord( value ) ) return false;
  const channel = value.channel;
  if( !isRecord( channel ) ) return false;
  return typeof channel.slug === "string"
    && typeof channel.name === "string"
    && isNullableString( channel.description )
    && typeof value.source === "string"
    && SOURCES.includes( value.source )
    && ( value.track === null || isTrack( value.track ) )
    && isNextTrack( value.next_track )
    && typeof value.listener_count === "number";
}
```

- [ ] **Step 4: Run the guard test**

Run: `yarn vitest run src/__tests__/components/nowPlayingTypes.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement the shared store `src/components/NowPlaying/nowPlayingStore.ts`**

One poller serves every subscriber. When the last subscriber leaves, polling stops and state resets.

```ts
import { useSyncExternalStore } from "react";
import { STREAM_ORIGIN } from "@/constants";
import { NowPlaying, isNowPlaying } from "@/components/NowPlaying/nowPlayingTypes";

export const NOW_PLAYING_URL = `${STREAM_ORIGIN}/api/now-playing/main`;
const POLL_INTERVAL_MS = 30_000;

export interface NowPlayingState {
  data: NowPlaying | null;
  errored: boolean;
}

const INITIAL_STATE: NowPlayingState = { data: null, errored: false };

let currentState: NowPlayingState = INITIAL_STATE;
const listeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;

function emit( nextState: NowPlayingState ) {
  currentState = nextState;
  listeners.forEach( listener => listener() );
}

async function fetchOnce() {
  try {
    const response = await fetch( NOW_PLAYING_URL );
    if( !response.ok ) throw new Error( `HTTP ${response.status}` );
    const payload: unknown = await response.json();
    if( !isNowPlaying( payload ) ) throw new Error( "now-playing payload failed validation" );
    if( listeners.size > 0 ) emit({ data: payload, errored: false });
  } catch {
    if( listeners.size > 0 ) emit({ ...currentState, errored: true });
  }
}

function schedulePoll() {
  pollTimer = setTimeout( () => {
    if( document.visibilityState === "visible" ) void fetchOnce();
    schedulePoll();
  }, POLL_INTERVAL_MS );
}

function handleVisibility() {
  if( document.visibilityState === "visible" ) void fetchOnce();
}

function subscribe( listener: () => void ) {
  listeners.add( listener );
  if( listeners.size === 1 ) {
    void fetchOnce();
    schedulePoll();
    document.addEventListener( "visibilitychange", handleVisibility );
  }
  return () => {
    listeners.delete( listener );
    if( listeners.size === 0 ) {
      if( pollTimer ) clearTimeout( pollTimer );
      pollTimer = undefined;
      document.removeEventListener( "visibilitychange", handleVisibility );
      currentState = INITIAL_STATE;
    }
  };
}

const getSnapshot = () => currentState;
const getServerSnapshot = () => INITIAL_STATE;

export function useNowPlaying(): NowPlayingState {
  return useSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
}
```

- [ ] **Step 6: Point `NowPlayingCard` at the store.** In `src/components/NowPlaying/NowPlayingCard.tsx`:
  - Delete the local `Track` and `NowPlaying` types and import them: `import { NowPlaying } from "@/components/NowPlaying/nowPlayingTypes";` and `import { useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";`.
  - Delete `POLL_INTERVAL_MS` and the whole first `useEffect` (the `fetchOnce` / `schedule` / `visibilitychange` block, including the `as NowPlaying` cast).
  - In its place, inside the component:

```tsx
  const nowPlaying = useNowPlaying();

  useEffect( () => {
    if( nowPlaying.data ) {
      dispatch({ type: "data", payload: nowPlaying.data });
    } else if( nowPlaying.errored ) {
      dispatch({ type: "error" });
    }
  }, [ nowPlaying ] );
```

  - Replace the offline link `href={ \`${STREAM_ORIGIN}/channels/${MAIN_CHANNEL_SLUG}\` }` with `href={ STREAM_CHANNEL_URL }` and import it from `@/constants`. Delete `MAIN_CHANNEL_SLUG` if nothing else uses it.

Run: `yarn vitest run src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS unchanged. These tests drive the card through `fetch`, so they now cover the store's fetch, polling and error paths too.

- [ ] **Step 7: Write the failing widget test** at `src/__tests__/components/OnAirWidget.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OnAirWidget from "@/components/Layout/OnAirWidget";

const payload = {
  channel: { slug: "main", name: "Audeos", description: null },
  source: "loop_fallback",
  track: { title: "Slappers", artist: "DJ Audeos", started_at: null, duration_ms: null, position_ms: null },
  next_track: null,
  listener_count: 0,
};

afterEach( () => {
  vi.unstubAllGlobals();
});

describe( "OnAirWidget", () => {
  it( "links to the stream and names the current track once loaded", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => payload }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm/channels/main" );
    await waitFor( () => expect( link.getAttribute( "aria-label" ) ).toContain( "Slappers by DJ Audeos" ) );
  });

  it( "still renders its label and link when the endpoint fails", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => { throw new Error( "offline" ); }) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link", { name: /audeos\.fm, on air/i });
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm/channels/main" );
  });

  it( "ignores a malformed payload instead of rendering it", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => ({ track: "x" }) }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    await waitFor( () => expect( fetch ).toHaveBeenCalled() );
    expect( link.getAttribute( "aria-label" ) ).not.toContain( "Now playing" );
  });
});
```

- [ ] **Step 8: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/OnAirWidget.test.tsx`
Expected: FAIL, cannot resolve `@/components/Layout/OnAirWidget`.

- [ ] **Step 9: Implement `src/components/Layout/OnAirWidget.tsx`**

```tsx
import { STREAM_CHANNEL_URL } from "@/constants";
import { NowPlayingState, useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";
import styles from "@/styles/OnAirWidget.module.scss";

const STATION_LABEL = "audeos.fm";

function describeStation({ data }: NowPlayingState ): string {
  const track = data?.track;
  if( !track ) return `${STATION_LABEL}, on air`;
  const byline = track.artist ? ` by ${track.artist}` : "";
  return `${STATION_LABEL}, on air. Now playing ${track.title}${byline}`;
}

export default function OnAirWidget() {
  const description = describeStation( useNowPlaying() );
  return (
    <a
      href={ STREAM_CHANNEL_URL }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.onAir }
      aria-label={ description }
      title={ description }
    >
      <span className={ styles.dot } aria-hidden="true" />
      <span className={ styles.desktopLabel } aria-hidden="true">{ STATION_LABEL }</span>
      <span className={ styles.phoneLabel } aria-hidden="true">On air</span>
    </a>
  );
}
```

`src/styles/OnAirWidget.module.scss`:

```scss
.onAir {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  color: var(--ink);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse 1.6s ease-in-out infinite;
}

@keyframes pulse {
  50% { opacity: 0.25; }
}

.phoneLabel { display: none; }

@media (max-width: 699px) {
  .desktopLabel { display: none; }
  .phoneLabel { display: inline; }
}

@media (prefers-reduced-motion: reduce) {
  .dot { animation: none; }
}
```

- [ ] **Step 10: Run the widget and card tests**

Run: `yarn vitest run src/__tests__/components/OnAirWidget.test.tsx src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS.

- [ ] **Step 11: Commit**

```bash
yarn format
git add -A src
git commit -m "feat: shared now-playing store with type guard and on-air widget"
```

---

### Task 3: Site frame — top bar, section links, footer

**Files:**
- Create: `src/lib/navLinks.ts`, `src/lib/socialLinks.ts`
- Modify: `src/components/Layout/TopNav.tsx:76-122` (returned markup only; search logic unchanged)
- Modify: `src/components/Layout/Footer.tsx:1-42` (move the links array out)
- Modify: `src/styles/Layout.module.scss:19-62` (`nav.topnav`, `div.searchWrapper`) and `footer.footer`
- Modify: `src/components/FilteredArchive/FilteredArchive.tsx:6,33,48` (drop `CategoryNav`)
- Delete: `src/components/CategoryNav.tsx`, `src/__tests__/components/CategoryNav.test.tsx`, and the `.categoryNav`, `.category`, `.categoryActive` rules in `src/styles/Home.module.scss:367-400`
- Test: `src/__tests__/lib/navLinks.test.ts`

**Interfaces:**
- Consumes: `CATEGORY_IDS`, `AUTHOR_SLUG` from `@/constants`; `CategoryConfigMap` from `@/types/categoryConfig`; `OnAirWidget` from Task 2.
- Produces: `interface NavLink { href: string; label: string }`, `function buildNavLinks( categoryConfig: CategoryConfigMap ): NavLink[]`, `function isActivePath( currentPath: string, href: string ): boolean`, `interface SocialLink { href: string; icon: IconType; title: string }`, `const SOCIAL_LINKS: SocialLink[]`.

- [ ] **Step 1: Write the failing test** at `src/__tests__/lib/navLinks.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildNavLinks, isActivePath } from "@/lib/navLinks";

const categoryConfig = {
  events: { title: "Events", description: "", ogImage: null },
  music: { title: "Music", description: "", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "", ogImage: null },
};

describe( "buildNavLinks", () => {
  it( "lists Events, Music, Lifestyle, then About", () => {
    expect( buildNavLinks( categoryConfig ) ).toEqual( [
      { href: "/category/events", label: "Events" },
      { href: "/category/music", label: "Music" },
      { href: "/category/lifestyle", label: "Lifestyle" },
      { href: "/author/audeos", label: "About" },
    ] );
  });

  it( "fails loudly when a category has no config", () => {
    expect( () => buildNavLinks({ music: categoryConfig.music, lifestyle: categoryConfig.lifestyle }) )
      .toThrow( /events/ );
  });
});

describe( "isActivePath", () => {
  it( "matches the section page and its paginated pages", () => {
    expect( isActivePath( "/category/events", "/category/events" ) ).toBe( true );
    expect( isActivePath( "/category/events/page/3", "/category/events" ) ).toBe( true );
  });

  it( "ignores query strings and hashes", () => {
    expect( isActivePath( "/category/music?ref=x#posts", "/category/music" ) ).toBe( true );
  });

  it( "does not match a different section that shares a prefix", () => {
    expect( isActivePath( "/category/eventsarchive", "/category/events" ) ).toBe( false );
    expect( isActivePath( "/", "/category/events" ) ).toBe( false );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/lib/navLinks.test.ts`
Expected: FAIL, cannot resolve `@/lib/navLinks`.

- [ ] **Step 3: Implement `src/lib/navLinks.ts`**

```ts
import { AUTHOR_SLUG, CATEGORY_IDS } from "@/constants";
import { CategoryConfigMap } from "@/types/categoryConfig";

export interface NavLink {
  href: string;
  label: string;
}

export const ABOUT_LABEL = "About";

export function buildNavLinks( categoryConfig: CategoryConfigMap ): NavLink[] {
  const categoryLinks = CATEGORY_IDS.map( categoryId => {
    const config = categoryConfig[categoryId];
    if( !config ) {
      throw new Error( `buildNavLinks: no categoryConfig entry for "${categoryId}"` );
    }
    return { href: `/category/${categoryId}`, label: config.title };
  });
  return [ ...categoryLinks, { href: `/author/${AUTHOR_SLUG}`, label: ABOUT_LABEL } ];
}

export function isActivePath( currentPath: string, href: string ): boolean {
  const [ path ] = currentPath.split( /[?#]/ );
  return path === href || path.startsWith( `${href}/` );
}
```

- [ ] **Step 4: Run the test**

Run: `yarn vitest run src/__tests__/lib/navLinks.test.ts`
Expected: PASS.

- [ ] **Step 5: Move the social links.** Create `src/lib/socialLinks.ts` containing the `SocialLink` interface and the `SOCIAL_LINKS` array exactly as they are today in `src/components/Layout/Footer.tsx:21-42` (with their `react-icons` imports), exported. In `Footer.tsx` delete those definitions and import `{ SOCIAL_LINKS }` from `@/lib/socialLinks`.

- [ ] **Step 6: Rebuild the top bar markup.** In `src/components/Layout/TopNav.tsx` add imports:

```tsx
import categoriesData from "../../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";
import { buildNavLinks, isActivePath } from "@/lib/navLinks";
import OnAirWidget from "@/components/Layout/OnAirWidget";
```

At module scope:

```tsx
const NAV_LINKS = buildNavLinks( categoriesData satisfies CategoryConfigMap );
```

Replace the returned JSX's outer `<nav className={ styles.topnav }>` and wordmark link with the structure below, keeping the existing `<div className={ styles.searchWrapper }>…</div>` block exactly as it is:

```tsx
  return (
    <header className={ styles.topbar }>
      <Link href="/" scroll={ false } className={ styles.wordmark }>Audeos.com</Link>
      { /* existing searchWrapper div, unchanged */ }
      <nav aria-label="Sections" className={ styles.sections }>
        { NAV_LINKS.map( link => {
          const active = isActivePath( router.asPath, link.href );
          return (
            <Link
              key={ link.href }
              href={ link.href }
              className={ styles.section }
              aria-current={ active ? "page" : undefined }
            >
              { link.label }
            </Link>
          );
        }) }
      </nav>
      <div className={ styles.onAirSlot }>
        <OnAirWidget />
      </div>
    </header>
  );
```

- [ ] **Step 7: Style the frame.** In `src/styles/Layout.module.scss` replace the `nav.topnav { … }` block (lines 19-40) with:

```scss
header.topbar {
  width: 100%;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  grid-template-areas: "wordmark search sections onair";
  align-items: center;
  gap: 1rem 1.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--ink);

  @media (max-width: 699px) {
    grid-template-columns: 1fr auto;
    grid-template-areas:
      "wordmark onair"
      "search search"
      "sections sections";
  }
}

a.wordmark {
  grid-area: wordmark;
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

nav.sections {
  grid-area: sections;
  display: flex;
  gap: 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (max-width: 699px) {
    justify-content: space-between;
    gap: 0.5rem;
  }
}

a.section {
  text-decoration: none;

  &[aria-current="page"] {
    text-decoration: underline;
    text-decoration-color: var(--accent);
    text-decoration-thickness: 3px;
    text-underline-offset: 6px;
  }
}

div.onAirSlot {
  grid-area: onair;
  justify-self: end;
}
```

In the existing `div.searchWrapper` rule add `grid-area: search;` and, inside a `@media (max-width: 699px)` block, `max-width: none;`. In `footer.footer` add `border-top: 1px solid var(--rule); padding-top: 1.5rem; margin-top: 2rem;`.

- [ ] **Step 8: Remove `CategoryNav`.** Delete `src/components/CategoryNav.tsx` and `src/__tests__/components/CategoryNav.test.tsx`. In `FilteredArchive.tsx` delete the import, the `currentCategory` constant and the `<CategoryNav … />` element. Delete `.categoryNav`, `.category` and `.categoryActive` from `Home.module.scss`.

Run: `grep -rn "CategoryNav\|categoryNav\|categoryActive" src`
Expected: no output.

- [ ] **Step 9: Verify and commit**

Run: `yarn format && yarn lint && yarn test`
Expected: PASS.

```bash
git add -A src
git commit -m "feat: top bar with section links and on-air widget; drop CategoryNav"
```

---

### Task 4: Masonry placement

**Files:**
- Create: `src/components/Masonry/placeCards.ts`
- Create: `src/components/Masonry/useMasonryPlacement.ts`
- Create: `src/styles/Masonry.module.scss`
- Test: `src/__tests__/components/placeCards.test.ts`, `src/__tests__/components/useMasonryPlacement.test.tsx`

**Interfaces:**
- Produces: `interface CardPlacement { column: number; rowStart: number; rowSpan: number }` (zero-based column and row), `function placeCards( cardHeights: number[], columnCount: number, rowUnit: number ): CardPlacement[]`, `function useMasonryPlacement( gridRef: RefObject<HTMLElement | null>, layoutKey: unknown ): void`, and the `.masonry` class in `Masonry.module.scss`.

- [ ] **Step 1: Write the failing placement test** at `src/__tests__/components/placeCards.test.ts`. Expected values come from the requirement "newest posts fill the top row left to right, then each card goes to the shortest column":

```ts
import { describe, it, expect } from "vitest";
import { placeCards } from "@/components/Masonry/placeCards";

describe( "placeCards", () => {
  it( "puts the first cards across the top row, left to right", () => {
    const placements = placeCards( [ 300, 200, 250 ], 3, 1 );
    expect( placements.map( placement => [ placement.column, placement.rowStart ] ) )
      .toEqual( [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ] );
  });

  it( "sends each later card to the currently shortest column", () => {
    const placements = placeCards( [ 300, 200, 250, 100, 100 ], 3, 1 );
    expect( placements[3] ).toEqual({ column: 1, rowStart: 200, rowSpan: 100 });
    expect( placements[4] ).toEqual({ column: 2, rowStart: 250, rowSpan: 100 });
  });

  it( "breaks ties toward the leftmost column", () => {
    const placements = placeCards( [ 100, 100, 100 ], 2, 1 );
    expect( placements[2].column ).toBe( 0 );
  });

  it( "rounds spans up to whole row units", () => {
    expect( placeCards( [ 95 ], 1, 10 )[0].rowSpan ).toBe( 10 );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/placeCards.test.ts`
Expected: FAIL, cannot resolve `@/components/Masonry/placeCards`.

- [ ] **Step 3: Implement `src/components/Masonry/placeCards.ts`**

```ts
export interface CardPlacement {
  column: number;
  rowStart: number;
  rowSpan: number;
}

export function placeCards( cardHeights: number[], columnCount: number, rowUnit: number ): CardPlacement[] {
  const columnHeights = Array.from({ length: columnCount }, () => 0 );
  return cardHeights.map( height => {
    const shortest = Math.min( ...columnHeights );
    const column = columnHeights.indexOf( shortest );
    const rowSpan = Math.max( 1, Math.ceil( height / rowUnit ) );
    columnHeights[column] += rowSpan;
    return { column, rowStart: shortest, rowSpan };
  });
}
```

- [ ] **Step 4: Run it**

Run: `yarn vitest run src/__tests__/components/placeCards.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing native-masonry test** at `src/__tests__/components/useMasonryPlacement.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useMasonryPlacement } from "@/components/Masonry/useMasonryPlacement";

function Grid() {
  const gridRef = useRef<HTMLUListElement>( null );
  useMasonryPlacement( gridRef, "key" );
  return (
    <ul ref={ gridRef } data-testid="grid">
      <li>one</li>
      <li>two</li>
    </ul>
  );
}

afterEach( () => {
  vi.unstubAllGlobals();
});

describe( "useMasonryPlacement", () => {
  it( "leaves layout to the browser when native masonry is supported", () => {
    vi.stubGlobal( "CSS", { supports: ( property: string, value: string ) => property === "display" && value === "grid-lanes" });
    const { getByTestId } = render( <Grid /> );
    const grid = getByTestId( "grid" );
    expect( grid.hasAttribute( "data-placed" ) ).toBe( false );
    grid.querySelectorAll( "li" ).forEach( item => {
      expect( item.style.gridColumn ).toBe( "" );
      expect( item.style.gridRow ).toBe( "" );
    });
  });
});
```

- [ ] **Step 6: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/useMasonryPlacement.test.tsx`
Expected: FAIL, cannot resolve the hook.

- [ ] **Step 7: Implement `src/components/Masonry/useMasonryPlacement.ts`**

In browsers without `display: grid-lanes`, the grid becomes 1px rows and every card gets an explicit column and row span from `placeCards`. DOM order never changes.

```ts
import { RefObject, useEffect } from "react";
import { placeCards } from "@/components/Masonry/placeCards";

const ROW_UNIT_PX = 1;
const PLACED_ATTRIBUTE = "data-placed";

function supportsNativeMasonry(): boolean {
  return typeof CSS !== "undefined"
    && typeof CSS.supports === "function"
    && CSS.supports( "display", "grid-lanes" );
}

function countColumns( grid: HTMLElement ): number {
  return getComputedStyle( grid ).gridTemplateColumns.split( " " ).filter( Boolean ).length;
}

export function useMasonryPlacement( gridRef: RefObject<HTMLElement | null>, layoutKey: unknown ): void {
  useEffect( () => {
    const grid = gridRef.current;
    if( !grid || supportsNativeMasonry() ) return;

    const items = Array.from( grid.children ).filter(
      ( child ): child is HTMLElement => child instanceof HTMLElement,
    );

    const layout = () => {
      grid.removeAttribute( PLACED_ATTRIBUTE );
      items.forEach( item => {
        item.style.gridColumn = "";
        item.style.gridRow = "";
      });
      const columnCount = countColumns( grid );
      if( columnCount < 1 ) return;
      const gap = parseFloat( getComputedStyle( grid ).rowGap ) || 0;
      const heights = items.map( item => item.getBoundingClientRect().height + gap );
      placeCards( heights, columnCount, ROW_UNIT_PX ).forEach( ( placement, index ) => {
        items[index].style.gridColumn = String( placement.column + 1 );
        items[index].style.gridRow = `${placement.rowStart + 1} / span ${placement.rowSpan}`;
      });
      grid.setAttribute( PLACED_ATTRIBUTE, "" );
    };

    layout();
    void document.fonts?.ready.then( layout );

    let lastWidth = grid.clientWidth;
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver( () => {
      if( grid.clientWidth === lastWidth ) return;
      lastWidth = grid.clientWidth;
      layout();
    });
    resizeObserver?.observe( grid );
    return () => resizeObserver?.disconnect();
  }, [ gridRef, layoutKey ] );
}
```

`src/styles/Masonry.module.scss`:

```scss
.masonry {
  --masonry-columns: 2;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(var(--masonry-columns), minmax(0, 1fr));
  gap: 2rem 1rem;
  align-items: start;

  @media (min-width: 900px) {
    --masonry-columns: 3;
    gap: 2.25rem 2rem;
  }

  // Script-placed fallback: 1px rows, the gap is folded into each card's span.
  &[data-placed] {
    grid-auto-rows: 1px;
    row-gap: 0;
  }
}

@supports (display: grid-lanes) {
  .masonry {
    display: grid-lanes;
  }
}
```

- [ ] **Step 8: Run both masonry tests**

Run: `yarn vitest run src/__tests__/components/placeCards.test.ts src/__tests__/components/useMasonryPlacement.test.tsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
yarn format
git add -A src
git commit -m "feat: masonry placement with native grid-lanes and a script fallback"
```

---

### Task 5: Post card and masonry post list

**Files:**
- Create: `src/utils/formatCardDate.ts`
- Create: `src/components/PostCard/PostCard.tsx`, `src/styles/PostCard.module.scss`
- Modify: `src/components/Home/BlogPostList.tsx` (render cards, masonry class, placement hook)
- Modify: `src/styles/Home.module.scss:56-246` (replace both `ul.imageGallery` blocks)
- Modify: `src/__tests__/components/BlogPostList.test.tsx` (fixtures and mocks)
- Test: `src/__tests__/utils/formatCardDate.test.ts`, `src/__tests__/components/PostCard.test.tsx`

**Interfaces:**
- Consumes: `useMasonryPlacement`, `.masonry` from Task 4; `--hatch`, `--mute`, `--accent`, `--font-mono` from Task 1.
- Produces: `function formatCardDate( timestamp: string ): string`; `interface PostCardImage { url: string; alt: string; width: number; height: number }`; `interface PostCardData { href: string; title: string; timestamp: string; categoryLabel: string; image: PostCardImage | null }`; `function cardImageFromPost( post: BlogPost ): PostCardImage | null`; `function cardDataFromPost( post: BlogPost, categoryLabel: string ): PostCardData`; `export default function PostCard({ card, priority }: { card: PostCardData; priority?: boolean })`. `BlogPostList` keeps its existing props.

- [ ] **Step 1: Write the failing date test** at `src/__tests__/utils/formatCardDate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatCardDate } from "@/utils/formatCardDate";

describe( "formatCardDate", () => {
  it( "formats a Contentful date as MM.DD.YY", () => {
    expect( formatCardDate( "2026-06-11" ) ).toBe( "06.11.26" );
  });

  it( "keeps the calendar date of a UTC timestamp regardless of the viewer's timezone", () => {
    expect( formatCardDate( "2026-01-05T23:30:00Z" ) ).toBe( "01.05.26" );
  });

  it( "fails loudly on a value that is not an ISO date", () => {
    expect( () => formatCardDate( "June 11" ) ).toThrow( /June 11/ );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/utils/formatCardDate.test.ts`
Expected: FAIL, cannot resolve `@/utils/formatCardDate`.

- [ ] **Step 3: Implement `src/utils/formatCardDate.ts`**

```ts
const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatCardDate( timestamp: string ): string {
  const match = ISO_DATE_PREFIX.exec( timestamp );
  if( !match ) {
    throw new Error( `formatCardDate: "${timestamp}" is not an ISO date` );
  }
  const [ , year, month, day ] = match;
  return `${month}.${day}.${year.slice( 2 )}`;
}
```

Run: `yarn vitest run src/__tests__/utils/formatCardDate.test.ts`
Expected: PASS.

- [ ] **Step 4: Write the failing card tests** at `src/__tests__/components/PostCard.test.tsx`. The card takes a plain `PostCardData`, so blog posts and search results can both feed it:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import PostCard, { cardDataFromPost } from "@/components/PostCard/PostCard";

const basePost = {
  sys: { id: "1", createdAt: "2026-06-01T00:00:00Z" },
  fields: { title: "Kick Off Day Party", slug: "kick-off-day-party", date: "2026-06-11", category: "events" },
  metadata: { tags: [] },
};

const withImage = ( details: object ) => ({
  ...basePost,
  fields: {
    ...basePost.fields,
    image: { fields: { description: "Flyer", file: { url: "//images.ctfassets.net/flyer.png", details } } },
  },
});

describe( "cardDataFromPost", () => {
  it( "carries the cover's real dimensions", () => {
    const card = cardDataFromPost( withImage({ size: 1, image: { width: 1080, height: 1350 } }) as never, "Events" );
    expect( card.image ).toEqual({ url: "//images.ctfassets.net/flyer.png", alt: "Flyer", width: 1080, height: 1350 });
    expect( card.href ).toBe( "/post/kick-off-day-party" );
  });

  it( "has no image when the post has no cover", () => {
    expect( cardDataFromPost( basePost as never, "Events" ).image ).toBeNull();
  });

  it( "fails the build when the cover image has no dimensions", () => {
    expect( () => cardDataFromPost( withImage({ size: 1 }) as never, "Events" ) ).toThrow( /kick-off-day-party/ );
  });
});

describe( "PostCard", () => {
  const card = {
    href: "/post/kick-off-day-party",
    title: "Kick Off Day Party",
    timestamp: "2026-06-11",
    categoryLabel: "Events",
    image: { url: "//images.ctfassets.net/flyer.png", alt: "Flyer", width: 1080, height: 1350 },
  };

  it( "sizes the image frame to the cover's real aspect ratio", () => {
    const { container } = render( <PostCard card={ card } /> );
    expect( container.querySelector( "[data-frame]" )?.getAttribute( "data-ratio" ) ).toBe( "1080 / 1350" );
  });

  it( "renders a 4:3 placeholder and the title when there is no image", () => {
    const { container } = render( <PostCard card={ { ...card, image: null } } /> );
    expect( container.querySelector( "img" ) ).toBeNull();
    expect( container.querySelector( "[data-frame]" )?.getAttribute( "data-ratio" ) ).toBe( "4 / 3" );
    expect( screen.getByRole( "heading", { name: "Kick Off Day Party" }) ).toBeInTheDocument();
  });

  it( "shows the short date and category, linking to the post", () => {
    render( <PostCard card={ card } /> );
    expect( screen.getByText( "06.11.26" ) ).toBeInTheDocument();
    expect( screen.getByText( "Events" ) ).toBeInTheDocument();
    expect( screen.getByRole( "link" ).getAttribute( "href" ) ).toBe( "/post/kick-off-day-party" );
  });
});
```

- [ ] **Step 5: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/PostCard.test.tsx`
Expected: FAIL, cannot resolve `@/components/PostCard/PostCard`.

- [ ] **Step 6: Implement `src/components/PostCard/PostCard.tsx`**

```tsx
import Link from "next/link";
import Picture from "@/components/Picture";
import { BlogPost } from "@/utils/contentfulUtils";
import { resolvePostDate } from "@/utils/blogPostUtils";
import { formatCardDate } from "@/utils/formatCardDate";
import styles from "@/styles/PostCard.module.scss";

const IMAGE_WIDTH = 800;
const PLACEHOLDER_RATIO = "4 / 3";

export interface PostCardImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PostCardData {
  href: string;
  title: string;
  timestamp: string;
  categoryLabel: string;
  image: PostCardImage | null;
}

export function cardImageFromPost( post: BlogPost ): PostCardImage | null {
  const file = post.fields.image?.fields.file;
  if( !file?.url ) return null;
  const dimensions = file.details.image;
  if( !dimensions ) {
    throw new Error( `PostCard: cover image for post "${post.fields.slug}" has no width and height in Contentful` );
  }
  return {
    url: file.url,
    alt: post.fields.image?.fields.description || "",
    width: dimensions.width,
    height: dimensions.height,
  };
}

export function cardDataFromPost( post: BlogPost, categoryLabel: string ): PostCardData {
  return {
    href: `/post/${post.fields.slug}`,
    title: post.fields.title,
    timestamp: resolvePostDate( post ),
    categoryLabel,
    image: cardImageFromPost( post ),
  };
}

export interface PostCardProps {
  card: PostCardData;
  priority?: boolean;
}

export default function PostCard({ card, priority = false }: PostCardProps ) {
  const coverRatio = card.image ? `${card.image.width} / ${card.image.height}` : PLACEHOLDER_RATIO;
  return (
    <Link href={ card.href } className={ styles.card }>
      <span className={ styles.frame } data-frame data-ratio={ coverRatio } style={ { aspectRatio: coverRatio } }>
        { card.image && (
          <Picture url={ card.image.url } maxWidth={ IMAGE_WIDTH } alt={ card.image.alt } priority={ priority } />
        ) }
      </span>
      <span className={ styles.meta }>
        <time dateTime={ card.timestamp }>{ formatCardDate( card.timestamp ) }</time>
        <span className={ styles.category }>{ card.categoryLabel }</span>
      </span>
      <h3 className={ styles.title }>{ card.title }</h3>
    </Link>
  );
}
```

`src/styles/PostCard.module.scss`:

```scss
.card {
  display: block;
  color: inherit;
  text-decoration: none;
}

.frame {
  display: block;
  overflow: hidden;
  background-image: var(--hatch);

  picture,
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: scale 0.4s ease;
  }
}

.card:hover .frame img {
  scale: 1.03;
}

.meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-inline: 2px;
  font-family: var(--font-mono);
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--mute);
}

.category {
  color: var(--accent);
}

.title {
  margin-top: 0.4rem;
  padding-inline: 2px;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.3;
  text-wrap: pretty;
}

@media (prefers-reduced-motion: reduce) {
  .frame img { transition: none; }
}
```

- [ ] **Step 7: Run the card tests**

Run: `yarn vitest run src/__tests__/components/PostCard.test.tsx`
Expected: PASS.

- [ ] **Step 8: Render cards in `BlogPostList`.** In `src/components/Home/BlogPostList.tsx`:
  - Remove the imports of `Link`, `DateTimeFormat`, `Picture`, `Tags` and `resolvePostDate`, and the `IMAGE_WIDTH` constant.
  - Add:

```tsx
import PostCard, { cardDataFromPost } from "@/components/PostCard/PostCard";
import { useMasonryPlacement } from "@/components/Masonry/useMasonryPlacement";
import masonryStyles from "@/styles/Masonry.module.scss";
import categoriesData from "../../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";

const CATEGORY_CONFIG: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;

function categoryLabelFor( post: BlogPost ): string {
  const category = post.fields.category;
  const config = category ? CATEGORY_CONFIG[category] : undefined;
  if( !config ) {
    throw new Error( `BlogPostList: post "${post.fields.slug}" has unknown category "${category}"` );
  }
  return config.title;
}
```

  - After `useCardInteractions( listRef );` add `useMasonryPlacement( listRef, \`${page}-${tagId}-${posts.length}\` );`.
  - Change the list's class to `className={ \`${styles.imageGallery} ${masonryStyles.masonry}\` }`.
  - Replace the whole `<li>…</li>` body with:

```tsx
              <li key={ post.sys.id } style={ { viewTransitionName: `post-${post.fields.slug}` } }>
                <PostCard
                  card={ cardDataFromPost( post, categoryLabelFor( post ) ) }
                  priority={ firstCardPriority && cardIndex === 0 }
                />
              </li>
```

  `tagId` stays a prop because the effect keys still use it; tag chips no longer render on cards (tags stay on post pages).

- [ ] **Step 9: Replace the gallery styles.** In `src/styles/Home.module.scss` replace everything from the first `ul.imageGallery {` (line 56) through the end of the second `ul.imageGallery` block (just before `.tagSection` at line 247) with:

```scss
ul.imageGallery {
  width: 100%;
  padding: 1.5rem 2rem 0;

  @media (max-width: 699px) {
    padding: 1rem 1rem 0;
  }

  li {
    opacity: 0;
    translate: 0 24px;
    transition: opacity 0.7s ease, translate 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  li.visible {
    opacity: 1;
    translate: 0 0;
  }

  li.longPressPreview {
    scale: 1.02;
  }

  @media (prefers-reduced-motion: reduce) {
    li {
      opacity: 1;
      translate: none;
      transition: none;
    }
  }
}
```

- [ ] **Step 10: Update the list test fixtures.** In `src/__tests__/components/BlogPostList.test.tsx`:
  - Delete the `vi.mock( "@/components/Tags", … )` and `vi.mock( "@/components/DateTimeFormat", … )` blocks; neither component renders in the list any more.
  - In `makePosts`, give each post `category: "events"` and give the image file `details: { size: 1, image: { width: 800, height: 600 } }`.

Run: `yarn vitest run src/__tests__/components/BlogPostList.test.tsx`
Expected: PASS. These tests still cover page slicing, view-transition names, the reveal observer, reduced motion, hrefs and first-card priority.

- [ ] **Step 11: Verify and commit**

Run: `yarn format && yarn lint && yarn test`
Expected: PASS.

```bash
git add -A src
git commit -m "feat: post cards at true aspect ratio in a masonry list"
```

---

### Task 6: Giant word and inline logo

**Files:**
- Create (generated): `src/components/GiantWord/audeosLogoPath.ts`
- Create: `src/components/GiantWord/AudeosLogo.tsx`, `src/components/GiantWord/useFitWidth.ts`, `src/components/GiantWord/GiantWord.tsx`, `src/styles/GiantWord.module.scss`
- Test: `src/__tests__/components/GiantWord.test.tsx`

**Interfaces:**
- Consumes: `--font-mona-sans`, `--ink`, `--rule` from Task 1.
- Produces: `interface GiantWordProps { text: string; stackedLogoOnPhone?: boolean }`, `export default function GiantWord( props: GiantWordProps )`. It renders the page's `h1`.

- [ ] **Step 1: Generate the logo path module** from the committed asset:

```bash
node -e '
const fs = require("fs");
const svg = fs.readFileSync("docs/superpowers/specs/assets/audeos-logo-clean.svg", "utf8");
const match = svg.match(/ d="([^"]+)"/);
if (!match) throw new Error("audeos-logo-clean.svg has no path data");
fs.writeFileSync("src/components/GiantWord/audeosLogoPath.ts",
  "// Generated from docs/superpowers/specs/assets/audeos-logo-clean.svg. Regenerate, do not edit.\n" +
  "export const AUDEOS_LOGO_PATH =\n  \"" + match[1] + "\";\n");
'
```

Expected: the file exists and starts with `// Generated from`.

- [ ] **Step 2: Write the failing heading test** at `src/__tests__/components/GiantWord.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GiantWord from "@/components/GiantWord/GiantWord";

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "GiantWord", () => {
  it( "renders the page heading as real text", () => {
    render( <GiantWord text="Events" /> );
    expect( screen.getByRole( "heading", { level: 1, name: "Events" }) ).toBeInTheDocument();
  });

  it( "labels the phone logo so the stacked mark still reads as Audeos", () => {
    render( <GiantWord text="Audeos" stackedLogoOnPhone /> );
    expect( screen.getByRole( "img", { name: "Audeos" }) ).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/GiantWord.test.tsx`
Expected: FAIL, cannot resolve `@/components/GiantWord/GiantWord`.

- [ ] **Step 4: Implement the logo, the fit hook and the heading.**

`src/components/GiantWord/AudeosLogo.tsx`:

```tsx
import { AUDEOS_LOGO_PATH } from "@/components/GiantWord/audeosLogoPath";

export interface AudeosLogoProps {
  className?: string;
}

export default function AudeosLogo({ className }: AudeosLogoProps ) {
  return (
    <svg
      className={ className }
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1008 1010"
      fillRule="evenodd"
      role="img"
      aria-label="Audeos"
    >
      <path fill="currentColor" d={ AUDEOS_LOGO_PATH } />
    </svg>
  );
}
```

`src/components/GiantWord/useFitWidth.ts` — phones only; desktop keeps the CSS size and crops:

```ts
import { RefObject, useEffect } from "react";

export const PHONE_QUERY = "(max-width: 699px)";
const MEASURE_SIZE_PX = 100;

export function useFitWidth( wordRef: RefObject<HTMLElement | null>, text: string ): void {
  useEffect( () => {
    const word = wordRef.current;
    const container = word?.parentElement;
    if( !word || !container ) return;
    const phoneQuery = window.matchMedia( PHONE_QUERY );

    const fit = () => {
      if( !phoneQuery.matches ) {
        word.style.fontSize = "";
        return;
      }
      word.style.fontSize = `${MEASURE_SIZE_PX}px`;
      const measuredWidth = word.getBoundingClientRect().width;
      if( measuredWidth === 0 ) return;
      word.style.fontSize = `${( MEASURE_SIZE_PX * container.clientWidth / measuredWidth ).toFixed( 2 )}px`;
    };

    fit();
    void document.fonts?.ready.then( fit );
    phoneQuery.addEventListener( "change", fit );
    window.addEventListener( "resize", fit );
    return () => {
      phoneQuery.removeEventListener( "change", fit );
      window.removeEventListener( "resize", fit );
    };
  }, [ wordRef, text ] );
}
```

`src/components/GiantWord/GiantWord.tsx`:

```tsx
import { useRef } from "react";
import AudeosLogo from "@/components/GiantWord/AudeosLogo";
import { useFitWidth } from "@/components/GiantWord/useFitWidth";
import styles from "@/styles/GiantWord.module.scss";

export interface GiantWordProps {
  text: string;
  stackedLogoOnPhone?: boolean;
}

export default function GiantWord({ text, stackedLogoOnPhone = false }: GiantWordProps ) {
  const wordRef = useRef<HTMLSpanElement>( null );
  useFitWidth( wordRef, text );
  const wordClassName = stackedLogoOnPhone ? `${styles.word} ${styles.desktopOnly}` : styles.word;
  return (
    <div className={ styles.giant }>
      <h1 className={ styles.heading }>
        <span ref={ wordRef } className={ wordClassName }>{ text }</span>
        { stackedLogoOnPhone && <AudeosLogo className={ styles.phoneLogo } /> }
      </h1>
    </div>
  );
}
```

`src/styles/GiantWord.module.scss` — the trailing `padding-right` equal to the letter spacing makes the box match the ink:

```scss
.giant {
  width: 100%;
  overflow: clip;
  padding: clamp(28px, 4vw, 44px) 0 clamp(28px, 4vw, 44px) 6px;
  border-bottom: 1px solid var(--ink);
}

.heading {
  font: inherit;
  line-height: 1;
}

.word {
  display: inline-block;
  font-family: var(--font-mona-sans), sans-serif;
  font-size: 30vw;
  font-weight: 900;
  font-stretch: 82%;
  letter-spacing: -0.105em;
  padding-right: 0.105em;
  line-height: 1;
  text-transform: uppercase;
  white-space: nowrap;
  text-box: trim-both cap alphabetic;
  view-transition-name: giant-word;
  animation: giant-word-load 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

@keyframes giant-word-load {
  from { translate: 30% 0; opacity: 0; }
}

.phoneLogo {
  display: none;
}

@media (max-width: 699px) {
  .giant {
    padding-inline: 0;
  }

  .word {
    font-size: 22vw;
  }

  .desktopOnly {
    display: none;
  }

  .phoneLogo {
    display: block;
    width: calc(100% - 56px);
    height: auto;
    margin-inline: auto;
    color: var(--ink);
  }
}

@media (prefers-reduced-motion: reduce) {
  .word { animation: none; }
}
```

- [ ] **Step 5: Run the test**

Run: `yarn vitest run src/__tests__/components/GiantWord.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
yarn format
git add -A src
git commit -m "feat: giant word heading with inline logo on phones"
```

---

### Task 7: Home and category pages use the giant word and category blocks

**Files:**
- Modify: `src/components/Home/CategoryPostSections.tsx` (section markup and counts)
- Modify: `src/styles/Home.module.scss:247-340` (replace `.tagSection`, `.tagSectionHeader`, `.seeAll`, `.seeAllFooter`)
- Modify: `src/__tests__/components/CategoryPostSections.test.tsx` (old "See all {title}" assertions)
- Modify: `src/pages/index.tsx:37-45`
- Modify: `src/components/FilteredArchive/FilteredArchive.tsx`, `src/components/FilteredArchive/getCategoryStaticProps.ts:37-40`

**Interfaces:**
- Consumes: `GiantWord` from Task 6; `BlogPostList` from Task 5.
- Produces: `FilteredArchiveProps.heading?: string`, set only by `getCategoryStaticProps`.

- [ ] **Step 1: Write the failing count test.** Add to `src/__tests__/components/CategoryPostSections.test.tsx`, inside the existing `describe` (the mock already sets `POSTS_PER_CATEGORY_SECTION` to 6). The requirement is that both links state the category's total post count, not the six shown:

```tsx
  it( "states the category's total post count, not just the posts shown", () => {
    const items = Array.from({ length: 8 }, ( _unused, index ) =>
      makePost({ slug: `e${index}`, date: `2026-04-0${index + 1}`, category: "events" }) );
    const { getByText } = render(
      <CategoryPostSections posts={ { items } as never } categoryConfig={ categoryConfig as never } />,
    );
    expect( getByText( "See all 8 →" ).getAttribute( "href" ) ).toBe( "/category/events" );
    expect( getByText( "All 8 events →" ).getAttribute( "href" ) ).toBe( "/category/events" );
  });
```

Delete any existing assertion on the old `See all {title} →` text; this test replaces it.

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/components/CategoryPostSections.test.tsx`
Expected: FAIL, unable to find "See all 8 →".

- [ ] **Step 3: Rewrite the section markup.** In `CategoryPostSections.tsx`, compute the total alongside the slice and replace the returned `<section>`:

```tsx
  const sections = CATEGORY_IDS
    .map( categoryId => {
      const allInCategory = posts.items.filter( post => post.fields.category === categoryId );
      const categoryPosts = [ ...allInCategory ]
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return { categoryId, categoryPosts, total: allInCategory.length };
    })
    .filter( section => section.categoryPosts.length > 0 );
```

```tsx
        const href = `/category/${section.categoryId}`;
        return (
          <section key={ section.categoryId } id={ `category-${section.categoryId}` } className={ styles.categorySection }>
            <header className={ styles.categoryHeader }>
              <h2 className={ styles.categoryWord }>
                <Link href={ href }>{ config.title }</Link>
              </h2>
              <Link href={ href } className={ styles.seeAll }>See all { section.total } →</Link>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
            />
            <Link href={ href } className={ styles.allLink }>
              All { section.total } { config.title.toLowerCase() } →
            </Link>
          </section>
        );
```

- [ ] **Step 4: Style the blocks.** In `Home.module.scss` replace `.tagSection` through `.seeAllFooter` (lines 247-340) with:

```scss
.categorySection {
  width: 100%;
  padding-top: 2rem;
  border-top: 1px solid var(--ink);
}

.categoryHeader {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  padding: 0 2rem;

  @media (max-width: 699px) {
    padding: 0 1rem;
  }
}

.categoryWord {
  font-family: var(--font-mona-sans), sans-serif;
  font-size: clamp(2.75rem, 7vw, 4.5rem);
  font-weight: 900;
  font-stretch: 82%;
  letter-spacing: -0.105em;
  line-height: 0.9;
  text-transform: uppercase;

  a {
    text-decoration: none;
  }
}

.seeAll {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.allLink {
  display: block;
  margin: 2.25rem 2rem 2.75rem;
  padding: 1.25rem;
  border: 1px solid var(--ink);
  font-family: var(--font-mona-sans), sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 900;
  font-stretch: 82%;
  letter-spacing: -0.04em;
  line-height: 0.9;
  text-transform: uppercase;
  text-decoration: none;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--accent);
    background-image: repeating-linear-gradient(-45deg, rgba(144, 238, 144, 0.25) 0 2px, transparent 2px 9px);
  }

  @media (max-width: 699px) {
    margin: 1.75rem 1rem 2rem;
  }
}
```

- [ ] **Step 5: Run the section tests**

Run: `yarn vitest run src/__tests__/components/CategoryPostSections.test.tsx`
Expected: PASS.

- [ ] **Step 6: Giant AUDEOS on the home page.** In `src/pages/index.tsx` import `GiantWord` from `@/components/GiantWord/GiantWord` and make it the first child of `<main>`:

```tsx
        <main className={ styles.main }>
          <GiantWord text="Audeos" stackedLogoOnPhone />
          <NowPlayingCard />
```

Keep `NowPlayingCard` and the "Browse all posts →" link; PR 2 moves the card to the Music page.

- [ ] **Step 7: Giant word on category pages.** In `getCategoryStaticProps.ts` add `heading: config.title` to the returned `props`. In `FilteredArchive.tsx` add `heading?: string` to `FilteredArchiveProps`, destructure it, import `GiantWord`, and render it first inside `<main>`:

```tsx
          { heading && <GiantWord text={ heading } /> }
```

Tag and chronological archive pages pass no heading and render no giant word, as the spec requires.

- [ ] **Step 8: Verify and commit**

Run: `yarn format && yarn lint && yarn test`
Expected: PASS.

```bash
git add -A src
git commit -m "feat: giant word on home and category pages; category blocks with totals"
```

---

### Task 8: Pagination and post page restyle

No new tests: markup order and styling only. Existing `Pagination` tests keep covering URLs.

**Files:**
- Modify: `src/styles/Home.module.scss:24-55` (`.pagination`, `.isCurrentPage`)
- Modify: `src/pages/post/[slug].tsx:97-150` (header markup)
- Modify: `src/styles/BlogPost.module.scss` (header rules)

**Interfaces:**
- Consumes: `--font-mona-sans`, `--font-mono`, `--mute`, `--ink`, `--accent`.

- [ ] **Step 1: Restyle pagination.** Replace `.pagination` and `.isCurrentPage` in `Home.module.scss` with:

```scss
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  margin-top: 2rem;
  padding: 1rem;
  border-top: 1px solid var(--ink);
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  a {
    display: grid;
    place-items: center;
    min-width: 2.25rem;
    min-height: 2.25rem;
    padding: 0 0.5rem;
    border: 1px solid transparent;
    text-decoration: none;

    &:hover {
      border-color: var(--rule);
    }
  }
}

.isCurrentPage {
  border-color: var(--ink) !important;
  font-weight: 700;
}
```

- [ ] **Step 2: Reorder the post header.** In `src/pages/post/[slug].tsx` import `categoriesData from "../../../data/categories.json"` and `CategoryConfigMap`, define `const CATEGORY_CONFIG: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;` at module scope, and replace the `<header>…</header>` element with:

```tsx
            <header>
              <h1 className={ styles.postTitle }>{ post.fields.title }</h1>
              <p className={ styles.postMeta }>
                <DateTimeFormat timestamp={ resolvePostDate( post ) } withDayName={ false } withTime={ false } />
                { post.fields.category && (
                  <Link href={ `/category/${post.fields.category}` } className={ styles.postCategory }>
                    { CATEGORY_CONFIG[post.fields.category]?.title ?? post.fields.category }
                  </Link>
                ) }
                { authorName && (
                  <span>
                    By { authorSlug
                      ? <Link rel="author" href={ `/author/${authorSlug}` }>{ authorName }</Link>
                      : authorName }
                  </span>
                ) }
              </p>
              <figure>
                <Image src={ metaImage } alt={ metaImageDesc } fill priority />
                <figcaption>{ metaImageDesc }</figcaption>
              </figure>
              <Tags tags={ post.metadata.tags } />
              <p>{ post.fields.description }</p>
            </header>
```

Delete `authorProfileImageSrc` and `authorImageUrl` if nothing else uses them.

- [ ] **Step 3: Style the header.** Add to `.main` in `BlogPost.module.scss`:

```scss
  .postTitle {
    margin-top: 1.5rem;
    font-family: var(--font-mona-sans), sans-serif;
    font-size: clamp(2.25rem, 6vw, 4rem);
    font-weight: 800;
    font-stretch: 90%;
    letter-spacing: -0.04em;
    line-height: 0.95;
    text-wrap: balance;
  }

  .postMeta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1rem;
    margin: 1rem 0 1.5rem;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mute);

    a {
      color: var(--accent);
    }
  }
```

- [ ] **Step 4: Verify and commit**

Run: `yarn format && yarn lint && yarn test`
Expected: PASS, including `src/__tests__/pages/post/slug.test.tsx`. If that test asserts the old header order or the author avatar, update only those assertions to the new order; do not weaken assertions about embeds or navigation.

```bash
git add -A src
git commit -m "feat: restyled pagination and post header"
```

---

### Task 9: Search results as cards, shared category titles

**Files:**
- Create: `src/utils/categoryTitle.ts`
- Modify: `src/lib/searchTypes.ts` (`SearchPost` fields)
- Modify: `src/pages/search.tsx` (results markup, `getStaticProps` fields, full-width layout)
- Modify: `src/components/Home/BlogPostList.tsx` and `src/pages/post/[slug].tsx` (use the shared helper)
- Modify: any test fixture that builds a `SearchPost` with `imageUrl` (`grep -rn imageUrl src/__tests__`)
- Test: `src/__tests__/utils/categoryTitle.test.ts`

**Interfaces:**
- Consumes: `PostCard`, `PostCardImage`, `cardImageFromPost` from Task 5; `useMasonryPlacement` and `.masonry` from Task 4.
- Produces: `function categoryTitleFor( categoryId: string | undefined ): string`; `SearchPost` gains `category: string` and `image: PostCardImage | null`, and loses `imageUrl`.

- [ ] **Step 1: Write the failing helper test** at `src/__tests__/utils/categoryTitle.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { categoryTitleFor } from "@/utils/categoryTitle";

describe( "categoryTitleFor", () => {
  it( "returns the configured title for a category", () => {
    expect( categoryTitleFor( "events" ) ).toBe( "Events" );
  });

  it( "fails loudly for a category with no config", () => {
    expect( () => categoryTitleFor( "podcasts" ) ).toThrow( /podcasts/ );
    expect( () => categoryTitleFor( undefined ) ).toThrow( /undefined/ );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/utils/categoryTitle.test.ts`
Expected: FAIL, cannot resolve `@/utils/categoryTitle`.

- [ ] **Step 3: Implement `src/utils/categoryTitle.ts`**

```ts
import categoriesData from "../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";

const CATEGORY_CONFIG: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;

export function categoryTitleFor( categoryId: string | undefined ): string {
  const config = categoryId ? CATEGORY_CONFIG[categoryId] : undefined;
  if( !config ) {
    throw new Error( `categoryTitleFor: no category config for "${categoryId}"` );
  }
  return config.title;
}
```

Run: `yarn vitest run src/__tests__/utils/categoryTitle.test.ts`
Expected: PASS.

- [ ] **Step 4: Use the helper everywhere.** In `BlogPostList.tsx` delete `CATEGORY_CONFIG`, `categoryLabelFor` and the `categoriesData` / `CategoryConfigMap` imports, and pass `cardDataFromPost( post, categoryTitleFor( post.fields.category ) )`. In `src/pages/post/[slug].tsx` delete its `CATEGORY_CONFIG` and imports and render `{ categoryTitleFor( post.fields.category ) }` inside the category link.

- [ ] **Step 5: Carry card data in the search index.** In `src/lib/searchTypes.ts` replace `imageUrl: string;` with:

```ts
  category: string;
  image: PostCardImage | null;
```

and add `import { PostCardImage } from "@/components/PostCard/PostCard";`. In `search.tsx` `getStaticProps`, replace the `imageUrl` line with:

```ts
        category: post.fields.category ?? "",
        image: cardImageFromPost( post ),
```

importing `cardImageFromPost` from `@/components/PostCard/PostCard`. Update any test fixture that still sets `imageUrl`.

- [ ] **Step 6: Render results as masonry cards.** In the search page component add:

```tsx
  const resultsRef = useRef<HTMLUListElement>( null );
  useMasonryPlacement( resultsRef, query );
```

Switch `<Layout>` to `<Layout isFullwidth>`, and replace the results `<ul>…</ul>` with:

```tsx
            <ul
              ref={ resultsRef }
              className={ `${searchStyles.resultList} ${masonryStyles.masonry}` }
              role="list"
            >
              { results.map( post => (
                <li key={ post.slug }>
                  <PostCard
                    card={ {
                      href: `/post/${post.slug}`,
                      title: post.title,
                      timestamp: post.date,
                      categoryLabel: categoryTitleFor( post.category ),
                      image: post.image,
                    } }
                  />
                </li>
              ) ) }
            </ul>
```

Import `useRef`, `PostCard`, `useMasonryPlacement`, `masonryStyles from "@/styles/Masonry.module.scss"` and `categoryTitleFor`. Remove the now-unused `DateTimeFormat` and `Tags` imports from the page. In `Search.module.scss`, drop the old per-result styles under `.resultList` and give `.resultList` `padding: 1.5rem 2rem 0;` (`1rem` on phones).

- [ ] **Step 7: Verify and commit**

Run: `yarn format && yarn lint && yarn test`
Expected: PASS.

```bash
git add -A src
git commit -m "feat: search results as masonry cards; shared category titles"
```

---

### Task 10: Giant-word hand-off between pages

**Files:**
- Create: `src/lib/useRouteViewTransition.ts`
- Modify: `src/pages/_app.tsx` (call the hook)
- Test: `src/__tests__/lib/useRouteViewTransition.test.tsx`

**Interfaces:**
- Consumes: the `giant-word` view-transition name set in Task 6 and the keyframes from Task 1.
- Produces: `function useRouteViewTransition(): void`.

- [ ] **Step 1: Write the failing test** at `src/__tests__/lib/useRouteViewTransition.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

type Handler = ( ...args: unknown[] ) => void;
const handlers = new Map<string, Handler>();

vi.mock( "next/router", () => ({
  useRouter: () => ({
    events: {
      on: ( event: string, handler: Handler ) => handlers.set( event, handler ),
      off: ( event: string ) => handlers.delete( event ),
    },
  }),
}) );

import { useRouteViewTransition } from "@/lib/useRouteViewTransition";

function Harness() {
  useRouteViewTransition();
  return null;
}

beforeEach( () => {
  handlers.clear();
  vi.stubGlobal( "matchMedia", ( query: string ) => ({ matches: false, media: query }) );
});

afterEach( () => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty( document, "startViewTransition" );
});

describe( "useRouteViewTransition", () => {
  it( "holds the transition open until the new route has rendered", async () => {
    let updateDone: Promise<void> | undefined;
    Object.defineProperty( document, "startViewTransition", {
      configurable: true,
      value: ( update: () => Promise<void> ) => { updateDone = update(); },
    });
    render( <Harness /> );

    handlers.get( "routeChangeStart" )?.( "/category/music", { shallow: false });
    let settled = false;
    void updateDone?.then( () => { settled = true; });
    await Promise.resolve();
    expect( settled ).toBe( false );

    handlers.get( "routeChangeComplete" )?.( "/category/music" );
    await updateDone;
    expect( settled ).toBe( true );
  });

  it( "does nothing in browsers without view transitions", () => {
    render( <Harness /> );
    expect( handlers.size ).toBe( 0 );
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `yarn vitest run src/__tests__/lib/useRouteViewTransition.test.tsx`
Expected: FAIL, cannot resolve `@/lib/useRouteViewTransition`.

- [ ] **Step 3: Implement `src/lib/useRouteViewTransition.ts`**

```ts
import { useEffect } from "react";
import { useRouter } from "next/router";

interface RouteChangeOptions {
  shallow?: boolean;
}

export function useRouteViewTransition(): void {
  const router = useRouter();

  useEffect( () => {
    if( !( "startViewTransition" in document ) ) return;
    if( window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches ) return;

    let finishTransition: ( () => void ) | null = null;

    const settle = () => {
      finishTransition?.();
      finishTransition = null;
    };

    const handleStart = ( _url: string, options?: RouteChangeOptions ) => {
      if( options?.shallow ) return;
      settle();
      document.startViewTransition( () => new Promise<void>( resolve => {
        finishTransition = resolve;
      }) );
    };

    router.events.on( "routeChangeStart", handleStart );
    router.events.on( "routeChangeComplete", settle );
    router.events.on( "routeChangeError", settle );
    return () => {
      router.events.off( "routeChangeStart", handleStart );
      router.events.off( "routeChangeComplete", settle );
      router.events.off( "routeChangeError", settle );
      settle();
    };
  }, [ router.events ] );
}
```

If the linter rejects the unused `_url` parameter name, rename it to `nextUrl` and keep it unused per the project's lint configuration rather than disabling the rule.

- [ ] **Step 4: Call it from `_app.tsx`.** Import `useRouteViewTransition` and call it on the line after `const router = useRouter();`.

- [ ] **Step 5: Run the test**

Run: `yarn vitest run src/__tests__/lib/useRouteViewTransition.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
yarn format
git add -A src
git commit -m "feat: hand the giant word between pages with view transitions"
```

---

### Task 11: Docs, full verification and pull request

**Files:**
- Modify: `CLAUDE.md` (Architecture, Routing, Styling)
- Check: `README.md` opening thesis and size

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Routing table, `/tags/[tagId]` row: change "reachable from per-card chips" to "reachable from the tag chips on post pages".
  - Styling section: add that the site is dark only, design tokens live as CSS custom properties in `src/styles/globals.css` (`--ink`, `--paper`, `--mute`, `--rule`, `--accent`, `--hatch`), and Mona Sans is loaded with its `wdth` axis as `--font-mona-sans`.
  - Data flow: add that `src/components/NowPlaying/nowPlayingStore.ts` is the single client-side poller of `audeos.fm/api/now-playing/main`, shared by `NowPlayingCard` and the top-bar `OnAirWidget`, and that payloads are validated by `isNowPlaying`. The existing "client-only" note for `NowPlayingCard` still holds for the store.
  - Architecture: note `GiantWord` (page `h1`; inline logo on phones for AUDEOS) and the masonry approach: native `display: grid-lanes` where supported, `useMasonryPlacement` fallback otherwise.

- [ ] **Step 2: Check the README.** Confirm the opening thesis still describes the site accurately and `wc -c README.md` stays under 16,000. No change is expected in this PR.

- [ ] **Step 3: Run the full CI-equivalent checks**

Run: `yarn format && yarn lint && yarn test && yarn build`
Expected: all pass; `dist/` builds with every category, tag, post and pagination route.

Run: `grep -rn "prefers-color-scheme\| as [A-Z]" src --include=*.ts --include=*.tsx --include=*.scss --include=*.css`
Expected: no `prefers-color-scheme`; no new `as` type assertions introduced by this branch (compare with `git diff origin/main` if the grep shows pre-existing ones).

- [ ] **Step 4: Ask the owner to check these in their running dev server** (do not start one):
  1. At 320px wide, `/category/lifestyle` shows LIFESTYLE whole and `document.documentElement.scrollWidth <= window.innerWidth` in the console.
  2. On a phone width, `/` shows the stacked AUDEOS logo; on desktop, one cropped AUDEOS line.
  3. In Chrome, the newest three posts sit across the top row of a masonry block; in Safari 26.4+, native masonry renders the same order.
  4. The on-air widget shows a pulsing green dot and links to audeos.fm.
  5. With "reduce motion" enabled, nothing slides or fades.

- [ ] **Step 5: Commit docs, push and open the PR**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md notes for the redesigned frame"
git push -u origin feat/hub-visual-system
gh pr create --base main --title "feat: hub redesign visual system and site frame" --body "Implements PR 1 of docs/superpowers/specs/2026-10-11-audeos-hub-redesign-design.md: dark-only tokens, top bar with on-air widget, giant headings, masonry post cards, restyled pagination and post header. No Contentful changes."
```
