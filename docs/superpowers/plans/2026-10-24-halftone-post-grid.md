# Halftone Post Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Post-grid cards rest as a still, per-card-colored halftone of their cover image, and the focused card reveals the full-color photo.

**Architecture:** A pure module (`halftone.ts`) owns the spec's numbers: palette, contrast and dot layout. A browser module draws a card's halftone onto a `<canvas>` from its loaded `<img>`. A hook schedules drawing: an `IntersectionObserver` plus a shared queue that draws one card per animation frame, with redraws on resize or a device-pixel-ratio change. `BlogPostList` renders the canvas over each picture and assigns colors by page-wide card index; CSS hides the photo at rest and swaps on focus.

**Tech Stack:** Next.js static export, React 19, TypeScript, SCSS modules, Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-10-24-halftone-post-grid-design.md`

## Global Constraints

- Dot pitch `4` CSS px; contrast `3`: `clamp((luminance − 0.5) × 3 + 0.5, 0, 1)`.
- Luminance from gamma-encoded sRGB bytes, no linearization: `(0.2126 R + 0.7152 G + 0.0722 B) / 255`.
- Sample canvas `ceil(width / pitch × 2)` × `ceil(height / pitch × 2)`, cover-fitted, `imageSmoothingQuality = "high"`; nearest sample per dot, no interpolation.
- Grid rotated 45° about the card's center; keep points within one pitch outside the card; radius `pitch × 0.5 × √2 × √luminance`; skip dots under 0.3 **device** px; fill black first, then one path in the tint, at `devicePixelRatio`.
- Colors in order: `#90ee90`, `#8ef0f7`, `#d4ff3a`, `#ff7a2f`, `#ff5fa8`, `#5b8cff`, `#ffffff`; card `n` gets `n mod 7`, with `n` counted across the whole page.
- Photo at opacity 0 at rest (not 0.3); focus shows the photo with 1.08 zoom over 0.3s and hides the canvas; reduced motion skips the fade and zoom.
- No halftone motion. Search `PostCard`s and post pages are unchanged.
- Drawing failures throw; never fall back to showing the photo dimmed.
- Repo rules: no `as` assertions, no single-character identifiers, run `pnpm format` after edits, don't start a dev server, build with `make build`.

## Review Focus

1. **An image that loads before hydration** (cached, or the eager first card): its `load` event is missed. Expect it to draw anyway; the hook checks `image.complete` on mount (Task 2).
2. **Window resize across a column breakpoint:** cards change width. Expect a redraw at the new size with 4px dots, never a stretched old bitmap (Task 2, `ResizeObserver`).
3. **Moving the window to a screen with a different pixel ratio:** expect crisp dots after the move (Task 2, a `matchMedia` resolution listener).
4. **Client-side navigation between pages** (new posts in the same list): expect each card to draw its new image and the queue to drop cards that unmounted (Task 2 cleanup).
5. **A home section with fewer than 12 posts:** the next section's colors continue from the actual count, not from 12 (Task 3 test).

---

### Task 1: Halftone math and palette

**Files:**
- Create: `src/components/Home/halftone.ts`
- Test: `src/__tests__/components/halftone.test.ts`

**Interfaces:**
- Produces:
  - `export const HALFTONE_PITCH = 4`
  - `export const HALFTONE_TINTS: readonly string[]` (the seven colors, in order)
  - `export function tintForCard( cardIndex: number ): string`
  - `export function adjustedLuminance( red: number, green: number, blue: number ): number`: bytes 0–255 in, contrast-adjusted 0–1 out.
  - `export interface LuminanceGrid { values: Float32Array; columns: number; rows: number }` (row-major, already contrast-adjusted)
  - `export interface HalftoneDot { x: number; y: number; radius: number }` (CSS px)
  - `export function sampleSize( width: number, height: number ): { columns: number; rows: number }`
  - `export function halftoneDots( grid: LuminanceGrid, width: number, height: number ): HalftoneDot[]`: drops dots with radius 0; the 0.3 device-px cutoff belongs to the drawer.

- [ ] **Step 1: Write the failing tests**

```ts
describe( "tintForCard", () => {
  it( "cycles the seven colors in order", () => {
    expect( tintForCard( 0 ) ).toBe( "#90ee90" );
    expect( tintForCard( 6 ) ).toBe( "#ffffff" );
    expect( tintForCard( 7 ) ).toBe( "#90ee90" );
  });
  it( "gives the second and third home sections blue and orange", () => {
    expect( tintForCard( 12 ) ).toBe( "#5b8cff" );
    expect( tintForCard( 24 ) ).toBe( "#ff7a2f" );
  });
});

describe( "adjustedLuminance", () => {
  it( "keeps mid gray, clamps darks to black and stretches by 3", () => {
    expect( adjustedLuminance( 127.5, 127.5, 127.5 ) ).toBeCloseTo( 0.5 );
    expect( adjustedLuminance( 51, 51, 51 ) ).toBe( 0 );          // 0.2 → −0.4 → 0
    expect( adjustedLuminance( 153, 153, 153 ) ).toBeCloseTo( 0.8 ); // 0.6 → 0.8
    expect( adjustedLuminance( 255, 255, 255 ) ).toBe( 1 );
  });
  it( "weights channels by Rec. 709 without linearizing", () => {
    expect( adjustedLuminance( 0, 255, 0 ) ).toBeCloseTo( Math.min( 1, ( 0.7152 - 0.5 ) * 3 + 0.5 ) );
  });
});

describe( "halftoneDots", () => {
  const uniform = ( value: number ) => {
    const { columns, rows } = sampleSize( 400, 300 );
    return { values: new Float32Array( columns * rows ).fill( value ), columns, rows };
  };
  it( "draws nothing for a black image", () => {
    expect( halftoneDots( uniform( 0 ), 400, 300 ) ).toEqual( [] );
  });
  it( "draws full-size dots covering the card for a white image", () => {
    const dots = halftoneDots( uniform( 1 ), 400, 300 );
    const fullRadius = HALFTONE_PITCH * 0.5 * Math.SQRT2;
    expect( dots.every( dot => dot.radius === fullRadius ) ).toBe( true );
    // 45° grid at a 4px pitch: about one dot per 16 px² over the card plus its one-pitch margin.
    expect( dots.length ).toBeGreaterThan( ( 400 * 300 ) / 16 );
  });
  it( "sizes dot area by brightness", () => {
    const [ quarter ] = halftoneDots( uniform( 0.25 ), 400, 300 );
    const [ full ] = halftoneDots( uniform( 1 ), 400, 300 );
    expect( ( quarter.radius / full.radius ) ** 2 ).toBeCloseTo( 0.25 );
  });
  it( "rotates the grid 45° about the card's center", () => {
    const dots = halftoneDots( uniform( 1 ), 400, 300 );
    expect( dots ).toContainEqual( expect.objectContaining({ x: 200, y: 150 }) );
    expect( dots.some( dot => Math.abs( dot.x - ( 200 + HALFTONE_PITCH * Math.SQRT1_2 ) ) < 1e-9 && Math.abs( dot.y - ( 150 + HALFTONE_PITCH * Math.SQRT1_2 ) ) < 1e-9 ) ).toBe( true );
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm vitest run src/__tests__/components/halftone.test.ts`
Expected: FAIL. The module doesn't exist.

- [ ] **Step 3: Implement `halftone.ts`**

`halftoneDots` walks integer steps from `−ceil(reach / pitch)` to `ceil(reach / pitch)` (where `reach = hypot(width, height)`), with `gridX` and `gridY` each equal to step × `HALFTONE_PITCH`, so one point lands exactly on the center. Each point maps to `centerX = width/2 + gridX·cos45 − gridY·sin45` and `centerY = height/2 + gridX·sin45 + gridY·cos45`. Skip points beyond one pitch outside the card. Read the nearest sample at `clamp(floor(centerX / width × columns))` and `clamp(floor(centerY / height × rows))`. Use radius `pitch × 0.5 × √2 × √value`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm vitest run src/__tests__/components/halftone.test.ts`
Expected: PASS

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git add src/components/Home/halftone.ts src/__tests__/components/halftone.test.ts
git commit -m "Add halftone dot layout and card palette"
```

### Task 2: Draw halftones on post-grid cards

**Files:**
- Create: `src/components/Home/drawHalftone.ts` (browser drawing)
- Create: `src/components/Home/useHalftoneCanvas.ts` (scheduling)
- Modify: `src/components/Picture.tsx` (optional `crossOrigin` pass-through)
- Modify: `src/components/Home/BlogPostList.tsx`
- Modify: `src/styles/Home.module.scss` (the `ul.imageGallery` block, lines ~104–300)

**Interfaces:**
- Consumes: Task 1's `sampleSize`, `adjustedLuminance`, `halftoneDots`, `tintForCard`.
- Produces:
  - `export function drawHalftone( canvas: HTMLCanvasElement, image: HTMLImageElement, tint: string ): void`: throws `Error` if `getContext( "2d" )` returns null; `getImageData` throws by itself on a tainted canvas.
  - `export function useHalftoneCanvas( containerRef: React.RefObject<HTMLElement | null>, tint: string ): React.RefObject<HTMLCanvasElement | null>`
  - `PictureProps.crossOrigin?: "anonymous"`, set on the `<img>`.
  - `BlogPostListProps.colorOffset?: number` (default `0`). Card `cardIndex` gets `tintForCard( colorOffset + cardIndex )`.

No new tests: this is canvas and observer wiring that jsdom can't draw, and the spec's numbers are pinned in Task 1. The existing `BlogPostList` tests must stay green.

- [ ] **Step 1: Implement `drawHalftone`**

Size the canvas backing store to `round(offsetWidth × devicePixelRatio)` × `round(offsetHeight × devicePixelRatio)`. Sample `image` into a `sampleSize` offscreen canvas, cover-fitted (centered; scale = `max(columns / naturalWidth, rows / naturalHeight)`) with `imageSmoothingQuality = "high"` and `willReadFrequently: true`. Build the `LuminanceGrid` with `adjustedLuminance`. Fill the canvas black, then add every dot whose `radius × ratio ≥ 0.3` to one path and fill it with `tint`.

- [ ] **Step 2: Implement `useHalftoneCanvas`**

- One module-level queue (`Set<() => void>`) drained one job per `requestAnimationFrame`, shared by every card on the page.
- On mount, observe the container with an `IntersectionObserver` (`rootMargin: "100% 0px"`). Once the card is near the screen and its `<img>` is loaded (`complete && naturalWidth`, or its `load` event), enqueue a draw.
- A `ResizeObserver` on the canvas re-enqueues a draw when its size changes, and so does a `matchMedia( \`(resolution: ${devicePixelRatio}dppx)\` )` `change` listener, re-registered after each change.
- Cleanup disconnects the observers, removes the listeners and deletes this card's pending job from the queue.
- Errors from `drawHalftone` aren't caught.

- [ ] **Step 3: Wire `Picture` and `BlogPostList`**

`Picture`: add the `crossOrigin` prop and pass it to `<img>`. `GalleryImageLink` takes `tint`, calls `useHalftoneCanvas( containerRef, tint )` and renders `<canvas ref={ canvasRef } className={ styles.halftone } aria-hidden="true" />` after `<Picture crossOrigin="anonymous" … />`. The tint goes straight to the canvas; no CSS variable is needed. Add the `colorOffset` prop.

- [ ] **Step 4: Update the styles**

In `ul.imageGallery`, the image link (`.galleryImage`) becomes `position: relative; display: block`. The rest-state `img` goes to `opacity: 0` (delete `$card-rest-opacity`). `.halftone` is `position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none` with an opacity transition of `$card-focus-duration`. Keep the hatch: `.halftone` is transparent until drawn, so the hatch shows through until the dots draw. In `li.focused, li:focus-within`, the photo goes to `opacity: 1` plus zoom (as now), and `.halftone` goes to `opacity: 0`. In the reduced-motion block, `.halftone` gets `transition: none`. Replace the old "Images rest dimmed…" comment with one that describes the halftone.

- [ ] **Step 5: Verify**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: no lint or type errors; all tests pass, including the existing `BlogPostList.test.tsx`.

- [ ] **Step 6: Commit**

```bash
git add src/components/Home/drawHalftone.ts src/components/Home/useHalftoneCanvas.ts src/components/Picture.tsx src/components/Home/BlogPostList.tsx src/styles/Home.module.scss
git commit -m "Rest post-grid cards as a per-card halftone"
```

### Task 3: Run the color cycle across the home page

**Files:**
- Modify: `src/components/Home/CategoryPostSections.tsx`
- Test: `src/__tests__/components/CategoryPostSections.test.tsx`

**Interfaces:**
- Consumes: Task 2's `BlogPostListProps.colorOffset`.

- [ ] **Step 1: Write the failing test**

Extend the existing `BlogPostList` mock to render `data-color-offset={ colorOffset ?? 0 }`. Then add:

```ts
it( "continues the color cycle from the cards above each section", () => {
  // POSTS_PER_CATEGORY_SECTION is mocked to 6. Give the first category 6 posts, the second 3, the third 6.
  // Expected offsets: 0, 6, 9.
  ...
  expect( offsets ).toEqual( [ "0", "6", "9" ] );
});
```

Build posts with the file's existing helpers, in `CATEGORY_IDS` order.

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm vitest run src/__tests__/components/CategoryPostSections.test.tsx`
Expected: FAIL on the assertion (offsets are `0, 0, 0`).

- [ ] **Step 3: Pass `colorOffset`**

Give each section the sum of the `categoryPosts.length` of the sections before it.

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm vitest run src/__tests__/components/CategoryPostSections.test.tsx`
Expected: PASS

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git add src/components/Home/CategoryPostSections.tsx src/__tests__/components/CategoryPostSections.test.tsx
git commit -m "Run the halftone color cycle across home sections"
```

### Task 4: Docs, measurement and PR

**Files:**
- Modify: `CLAUDE.md` (the **Post grids** and **Focused card** paragraphs under Styling)

- [ ] **Step 1: Update `CLAUDE.md`**

**Post grids:** tiles rest as a still halftone (4px round dots on a 45° grid, contrast 3) drawn on a canvas by `useHalftoneCanvas` once near the screen. The colors cycle through `HALFTONE_TINTS` by page-wide index (`colorOffset`). The `<img>` needs `crossOrigin="anonymous"`. **Focused card:** replace "images rest at 30% opacity over black" with "the halftone fades out to the full-color photo, which zooms in". Add that halftone motion such as scroll-driven dot size is parked in #166.

- [ ] **Step 2: Build**

Run: `make build`
Expected: the build succeeds. A fresh worktree needs the owner to link `.env` first; ask if it's missing.

- [ ] **Step 3: Lighthouse before and after**

Ask the owner how to run it: serving `dist/` statically counts as a server, so it needs their go-ahead, or they run it themselves. Run mobile Lighthouse on the home page for `main` and for this branch, and record LCP, TBT and CLS. If LCP regresses meaningfully, stop and bring the numbers to the owner.

- [ ] **Step 4: Owner check**

Ask the owner to check their running dev server on desktop (hover reveal) and on a phone (screen-center sweep).

- [ ] **Step 5: Commit, push and open the PR**

```bash
git add CLAUDE.md
git commit -m "Document the halftone post grid"
git push -u origin feat/166-halftone-post-grid
gh pr create --title "Rest post-grid cards as a per-card halftone" --body "<summary, Lighthouse before/after table, Refs #166>"
```

- [ ] **Step 6: Update #166**

Comment on https://github.com/aud-eos/audeos.com/issues/166: the halftone shipped (link the PR), the decisions it settled, and that scroll-driven dot size stays open. Leave the issue open.
