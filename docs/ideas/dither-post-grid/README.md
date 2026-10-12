# Dithered post grid (parked idea)

Tracking issue: https://github.com/aud-eos/audeos.com/issues/166

A 1-bit dot dither on `BlogPostList` images, with the full-color photo revealed for the card the reader is focused on. The layout it builds on shipped in https://github.com/aud-eos/audeos.com/pull/165: centered stamp captions on a gapless grid. The issue lists what's decided and what's still open.

## Files

- `mockup.template.html`: the mockup page. It is a standalone artifact page, so it has no `<html>`/`<head>` of its own, and its post data is a `__POSTS__` placeholder.
- `filter-mockup.template.html`: the simpler first pass. Cards rest behind a CSS filter (black and white, dim, a green tint and others), and the focused card shows full color and zooms in. It uses the same focus triggers as the dither mockup, without the dither. Published copy: https://claude.ai/artifact/2dqj6grTH5qApUcVvuDd8H
- `build-mockup.mjs`: fills a template's placeholder from the live home page and inlines the 12 most recent cover images.

```bash
node docs/ideas/dither-post-grid/build-mockup.mjs /tmp/dither-mockup.html
node docs/ideas/dither-post-grid/build-mockup.mjs /tmp/focus-study.html filter-mockup.template.html
```

Open the output in a browser, or publish it as an artifact. Published copy: https://claude.ai/artifact/KMiWwZTYoNSW3YSG1HrpFM

## How the mockup works

- **Dither:** each card samples its image once per dot (`cell` CSS px), applies contrast and brightness, and thresholds with a Bayer matrix or Atkinson error diffusion. Each lit cell is drawn as a square or round dot at device resolution, so dots stay sharp on retina screens.
- **Motion:** a 12 fps loop computes each card's dot size. In scroll mode it depends on the card's distance from the focus line, and `renderCard` skips any card whose inputs didn't change.
- **Focus line:** sits at the middle of the screen. It slides toward the top or bottom edge over the first and last half-screen of content, and stays between the first row's top and the last row's bottom.
- **Reveal:** `auto` uses hover when `(hover: hover) and (pointer: fine)` matches and screen center otherwise. It re-evaluates when that query's result changes. Hover is tracked with `elementFromPoint` from the last pointer position, because CSS `:hover` goes stale while the page scrolls under a still cursor.
- **Viewport tracking:** a document-tall sentinel's `IntersectionObserver.intersectionRect` gives the visible slice of the page. This is only needed because artifacts run in a cross-origin iframe, where `rootMargin` is ignored and the host page may do the scrolling. The real site can use a plain `rootMargin` observer.

## Real-site notes

- **Replace, don't stack:** the dither's scroll motion would replace `useRevealOnScroll`'s fade and scale rather than run alongside it.
- **Where the canvas goes:** a `<canvas>` inside `.galleryImage`'s `<picture>` sits under the stamp `figcaption` without touching it.
- **Read input type live:** `useCardInteractions` reads `(hover: none)` once; a live reveal should listen for the query's `change` event.
