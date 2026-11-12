# Halftone post grid

Tracking issue: https://github.com/aud-eos/audeos.com/issues/166

## Intent

Post-grid cards currently rest as photos at 30% opacity over black, and the focused card shows full color. The owner wants the resting cards to have the gritty, high-contrast, single-color print feel of a duotone poster grid (inspiration: a club-night site whose grid shows black-and-cyan photocopied photos). The resting state becomes a **halftone**: round dots in one color on black, with a different color per card. The focused card still reveals the full-color photo.

This settles the parked dither idea in #166 with a halftone in place of a 1-bit dither. It answers that issue's open questions on pattern, dot shape, ink, dot size, contrast, motion and where the image is computed.

## Goals

- Every `BlogPostList` card (home, category, tag and archive pages) rests as a still halftone of its cover image.
- Each card's dots take one color from a seven-color cycle, assigned by the card's position in the list.
- The focused card (`useCardFocus`: pointer with a mouse, screen-center sweep on touch, keyboard `:focus-within`) shows the full-color photo with today's zoom and timing.
- No regression in SEO or Lighthouse: the real `<img>` with its alt text stays in the page, and the drawing doesn't add meaningful Total Blocking Time.

## Non-goals

- **Scroll-driven dot size, or any other halftone motion.** The owner wants the halftone still for now and may revisit it later; it stays open in #166.
- Search results (`PostCard` masonry): unchanged, since they aren't dimmed today.
- Post pages and other images on the site.
- A post keeping the same color across pages. The owner said it's fine for color to follow grid position.

## Anti-goals

- A flash of the full-color photo before the dots draw.
- Dots that look blurry on retina screens or scale up with wide cards; dots stay 4 CSS px everywhere.
- Drawing every card at page load. The home page has 36 cards, so drawing them all at once would cost a few hundred ms of main-thread time.

## Decided by the owner

Picked in mockups built from real posts:

- **Effect:** halftone: round dots on a 45° grid, each dot's area tracking the brightness under it, drawn in the card's color on black.
- **Dot pitch:** 4 CSS px.
- **Contrast:** 3, applied to luminance before the dots are sized: `clamp((luminance − 0.5) × 3 + 0.5, 0, 1)`.
- **Colors, in cycle order:** lightgreen `#90ee90`, cyan `#8ef0f7`, acid `#d4ff3a`, orange `#ff7a2f`, pink `#ff5fa8`, blue `#5b8cff`, white `#ffffff`. Card `n` gets color `n mod 7`, where `n` counts cards across the whole page, not per list. On the home page the cycle runs on through the three category sections (`CategoryPostSections` renders three 12-card `BlogPostList`s): section one starts at lightgreen, section two at index 12 (blue), and section three at index 24 (orange). `BlogPostList` therefore takes a starting offset from its caller. Pages with a single list (category, tag and archive) start at 0 on every page; restarting on each paginated page is the designer's call.
- **Motion:** none. The halftone is still.
- **Where it's drawn:** in the browser, on a canvas per card, only as cards near the screen. Chosen over build-time images (an extra download per card, dots that scale with the card) and WebGL (too much machinery for a still image).

## Behavior

1. Before the image loads, the card shows the `--hatch` placeholder as today.
2. When the image has loaded and the card is within about one screen of the viewport, its halftone is drawn and shown. The photo stays hidden at rest (opacity 0, not 0.3), so it never shows unfiltered before the dots appear.
3. The focused card fades the halftone out and the photo in, and zooms the photo by 1.08 over 0.3s, as `li.focused` / `li:focus-within` do today.
4. A card redraws when its size changes (column-count breakpoints, window resize) or the device pixel ratio changes.
5. Under reduced motion, the fade and zoom are skipped as today. The halftone itself doesn't move, so it is unaffected.
6. `useRevealOnScroll`'s fade-and-scale entrance stays.

## Mechanics

These were checked during design:

- **CORS:** `images.ctfassets.net` returns `access-control-allow-origin: *`. The `<img>` needs `crossOrigin="anonymous"` so the canvas can read its pixels; without it, `getImageData` throws on a tainted canvas. `Picture` gains an optional pass-through prop for this; only `BlogPostList` sets it.
- **Sampling** must match the owner-approved mockup exactly, because contrast 3 magnifies small differences:
  1. Draw the loaded `<img>` cover-fitted (centered, `object-fit: cover` math) into an offscreen canvas of `ceil(width / pitch × 2)` × `ceil(height / pitch × 2)` pixels, with `imageSmoothingQuality = "high"`. The browser's downscale does the averaging, so there's no separate blur.
  2. For each sample, take luminance directly from the gamma-encoded sRGB bytes, with no linearization: `(0.2126 R + 0.7152 G + 0.0722 B) / 255`. Then apply the contrast above.
  3. Lay a grid at the 4px pitch, rotated 45° about the card's center. For each grid point inside the card (with one pitch of margin), read the **nearest** sample, with no interpolation, and draw a dot of radius `pitch × 0.5 × √2 × √luminance`. Skip dots with a radius under 0.3 device px.
  4. Fill the canvas black, then draw all dots in one path in the card's color, at `devicePixelRatio` so dots stay crisp.
- **Scheduling:** an `IntersectionObserver` with a root margin of about one viewport marks cards as ready to draw, and a queue draws at most one card per animation frame. This keeps any single task short, which keeps TBT low.
- **Failure is visible:** if a canvas can't be drawn (no 2D context, tainted canvas), let the error throw. The card then shows black at rest and the photo on focus. Don't fall back to showing the photo dimmed.

## Left to the builder

- Hook and module boundaries. A suggested shape: a pure halftone function (luminance grid in, dot list or drawing out) beside `cardFocus.ts`, and a hook or small component inside `GalleryImageLink` that owns the canvas, the observer and the draw queue.
- Where the color list lives. It must have a single source shared by the cycle and the canvas, such as an exported constant whose value goes into an inline `--card-tint` custom property.
- Tests, held to the repo's testing rules. Likely one test of the pure halftone function against requirement-derived expectations: a black image gives no dots, a white image gives full-size dots on every grid point, and dot area rises with brightness. Canvas drawing and scheduling are wiring.

## Done when

- `pnpm lint` and `pnpm test` pass, and `make build` succeeds.
- Lighthouse on the home page (mobile) shows no meaningful regression against `main` in LCP, TBT or CLS. The before and after numbers go in the PR description. Keep the first card's eager, high-priority fetch. If LCP regresses, stop and bring the numbers to the owner rather than bending an anti-goal (designer's call: a hidden photo or a canvas may stop counting as the LCP element, so this is measured rather than assumed).
- The owner checks the running dev server on desktop (hover reveal) and on a phone (screen-center sweep).
- `CLAUDE.md`'s **Post grids** and **Focused card** paragraphs describe the halftone resting state instead of the 30% opacity.
- #166 is updated: halftone shipped, and scroll-driven dot size stays open.
