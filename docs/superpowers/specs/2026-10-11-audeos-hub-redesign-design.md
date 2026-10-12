# Audeos.com hub redesign

Date: 2026-10-11
Status: PR 1 shipped (#153, follow-ups #156–#159). PR 2 sections revised after the 2026-10-12 copy pass; awaiting owner review.

## Goal

Turn audeos.com from a blog into the front door for Audeos, LLC while keeping the blog. Visitors who search for Audeos, or arrive from a flyer or a profile, should come away impressed, understand what Audeos does, and find the DJ booking information with prices. The site itself is a portfolio piece for frontend design work, so the design must feel deliberate and unlike a template.

Success means:

- A visitor can reach DJ rates and speaker-rental rates from any page in one click.
- Searches for "Audeos" surface a site that clearly identifies Audeos, LLC, its founder and its brands.
- The Events page can rank for "DJ for hire Seattle"-style searches.
- Every existing post, category, tag and author URL keeps working.

## Decisions already made

These were settled with the owner during brainstorming and are not open for redesign in planning.

- **Audeos is an entity, not a person.** Copy describes what Audeos puts out and offers, not a bio or elevator pitch, and never limits it to Seattle (the owner travels anywhere). A little mystery is welcome; the sections explain themselves. Search engines get the plain description from the meta description and structured data.
- **Music first.** Categories run Music, Events, Lifestyle everywhere. Events (paid work) is reachable in one click from the home page's "DJ FOR HIRE →" link.
- **The blog stays.** The evergreen marketing content sits on top of the existing category pages. There is no separate services section and no new top-level routes.
- **Categories carry the evergreen content.** Events holds DJ for hire plus speaker rentals with prices. Music holds releases and audeos.fm. Lifestyle stays a plain archive. The `lifestyle` slug is unchanged.
- **About is the existing author page**, `/author/audeos`, enriched. The author's name stays "Audeos". Brands live on this page.
- **Cannabis consulting and a software services page are out of scope.**
- **Copy lives in Contentful and is never final until the owner says so.** The copy pass produced stand-ins (see Copy pass status). The code ships with whatever the entries hold, so the owner can change any line later without a code change.
- **Contentful holds the evergreen content**, so prices and copy change without a code deploy.

## Visual system

### Fonts and colors

The redesign keeps the live site's existing fonts and drops everything else.

| Token | Value |
|---|---|
| Primary font | Mona Sans, already loaded through `next/font` in `src/pages/_app.tsx`, with its width axis enabled |
| Small labels, dates, prices meta | System monospace stack already in `globals.css` |
| Retro accent | VT323, unchanged where it is used today |
| Background | Black |
| Text | White |
| Muted text | White at reduced opacity |
| Only accent | The site's existing `lightgreen` |

- **Dark mode only.** Remove the `prefers-color-scheme` branches, the light palette and the Seattle skyline background. Set `color-scheme: dark`.
- **No purple, no gradients in new UI.** The Now Playing neon gradient is not reused anywhere in the redesign.
- Remove the unused Next.js starter variables from `globals.css`.

### The giant word

A huge word anchors the home, category and About pages: AUDEOS, MUSIC, EVENTS, LIFESTYLE.

- **Live-text words:** Mona Sans at weight 900 and about 82% width, letter spacing -0.105em so neighboring letters overlap.
- **Overlaps are solid.** Where letters overlap they merge into one white shape. Words are plain text in a single element, with no per-letter markup and no blend effects. All words share the one -0.105em spacing, with no per-word adjustments.
- **Desktop:** one line, sized so the whole word fills the container width, never cropped or scrolled. This includes AUDEOS.
- **Phone, AUDEOS only:** on Home and About, the stacked AUD over EOS is the owner's logo as an SVG, so it matches the favicon and logo exactly. AUDEOS is the only word that ever splits.
  - Source: the cleaned SVG committed with this spec at `docs/superpowers/specs/assets/audeos-logo-clean.svg`. It is a single path, 3.9 KB, about 2.1 KB compressed, labeled "Audeos" with `role="img"`, optimized with SVGO.
  - Its fill is `currentColor`. That only works when the SVG is inlined in the markup, so it ships as an inline SVG component, not an `<img>`.
  - It was traced from the raster logo, so edges wobble slightly at extreme zoom. This is invisible at phone size and accepted. A re-export from untraced vector letters can replace the file later without code changes.
  - Sized to leave a small margin on each side.
- **Phone, every other word:** MUSIC, EVENTS, LIFESTYLE and any future word stay on one line, scaled so the whole word fills the container width edge to edge. Nothing is cropped, so short words render taller and long words shorter. The sizing method is a planning decision: container-query units with a per-word ratio, or a maintained fit-text library.
- Trim the text box to the capital height and baseline with `text-box: trim-both cap alphabetic`, then apply equal padding above and below. Browsers without support keep the word, with slightly uneven spacing.
- Post pages do not use the giant word. They use a large title.

### Diagonal hatch

A faint white diagonal hatch, from the xerox-flyer direction, appears in one place:

1. Behind every card's image area until the image loads.

The owner rejected hatched spacer bands between sections. Sections are separated by plain rules.

### Motion

Kept minimal and fully disabled under `prefers-reduced-motion`.

- The giant word slides in on page load and settles with the whole word visible.
- Navigating between pages hands the giant word off to the next page's word through view transitions, building on the `view-transition` meta tag the site already sets. Unsupported browsers switch instantly.
- Cards fade up as they scroll into view.
- Card photos zoom slightly on hover.
- The on-air dot pulses.

## Site frame, on every page

### Top bar

- **Desktop:** wordmark "Audeos.com", the existing search input, then Music, Events, Lifestyle and About links, then the on-air widget.
- **Phone:** wordmark and on-air widget on the first row, full-width search on the second, the four links on the third. No menu hides any link.
- The current page's link is marked with a light green underline.
- The existing search behavior, with its preview dropdown and `/search` page, is unchanged.

### On-air widget

- Sits in the top-right corner of the top bar: a pulsing light green dot and white monospace text. It reads "AUDEOS.FM" on desktop and "ON AIR" on phones.
- audeos.fm streams 24/7, so the widget is always on. There is no off state.
- It links to the stream and shows the current track in its accessible label and tooltip.
- It is self-contained. Nothing else on the page changes color, type or content based on the stream.
- Data comes from the existing `audeos.fm/api/now-playing/main` endpoint, polled client-side as `NowPlayingCard` does today. If the request fails, the widget still renders its label and link.

### Footer

The existing footer content, restyled: all twelve social icons, the copyright line, and the stream status and cookie preference links. The social links stay a single constant that also feeds the About page's structured data.

## Pages

### Home, `/`

1. Top bar.
2. Giant AUDEOS.
3. A short stack of lines under the giant word, from the `homePage` entry, in its order. Each line is small monospace caps, label-style rather than a sentence. Optionally a live line underneath, "NOW PLAYING ON AUDEOS.FM: [track] — [artist]", from the shared now-playing store, shown only when `homePage.showNowPlaying` is on. Then one plain text link, "DJ FOR HIRE →", to `/category/events`. No dot, no "available for hire" label and no resume link.
4. Three category blocks in this order: Music, Events, Lifestyle. Each has:
   - The category name as a plain heading linking to the category page.
   - The twelve newest posts in the uniform card grid (12 fills every row at 2, 3 or 4 columns).
   - A "See all {Category} →" link below the grid.
5. Footer.

The `NowPlayingCard` leaves the home page. The homepage CollectionPage JSON-LD and the feed generation stay. The home page's `<title>` and meta description come from `homePage.seoTitle` and `homePage.seoDescription`.

### Category pages, `/category/[slug]` and its pagination

- Page 1 of Events and Music shows the evergreen layer above the archive. Lifestyle and every later page show only the giant word and archive.
- **Events evergreen layer:** giant EVENTS, intro, the DJ price list, then the speaker-rental price list as a secondary, smaller section under its own heading (rentals are an extra, not a second business), a short footnote line, and a booking link. The booking link opens a Cal.com inquiry call (issue #155); its label and URL are Contentful fields so the destination can change later.
- **Price list layout:** rows, not cards. Each row has the package name, inclusions in small monospace and a large price. Speaker rentals show two prices per row: "Gear only" and "With me", meaning the owner runs the sound.
- **Music evergreen layer:** giant MUSIC, intro, an audeos.fm player block, a row of listening links, then the archive. The player block replaces the current `NowPlayingCard` styling under the new visual system. The listening row is every music platform already in the shared social links: SoundCloud, Mixcloud, Bandcamp, Spotify, YouTube and Dropbox.
- The existing `CategoryNav` row is removed, since the top bar now links every category.

### About, `/author/audeos`

Giant AUDEOS, photo, bio from the author entry, links to the resume on ben-petty.com and to GitHub, the brands as rows in the price-list style with a link out, then the profile links. Brands: The North West Clothing, Crisis Clothing, Northwest Local Cannabis, DJ Audeos and audeos.fm. The final list and blurbs are part of the copy pass.

### Posts, `/post/[slug]`

Large title in Mona Sans, a monospace line with date and category, the cover image, the body, and tags. All embeds, galleries and maps behave as today.

### Tag, search and chronological archive pages

Tag and archive pages use the same top bar, post grid and pagination as the category pages, without an evergreen layer. Search results use masonry cards.

## Cards, grid and pagination

- **Post grid (home, category, tag and archive pages):** the pre-redesign uniform grid, restored in #157 after the masonry version was rejected. Same-size 4:3 images, title and date, per-card tag chips with the active tag highlighted on tag pages, the original columns (1, 2, 3 or 4 by width), spacing and scale-in reveal. The diagonal hatch shows behind each image until it loads.
- **Home sections** show 12 posts each, which fills every row at 2, 3 and 4 columns with nothing hidden (#159).
- **Search results** use masonry cards: the whole image at its natural aspect ratio, a monospace date and category line, then the title. Native `display: grid-lanes` where supported, else the `useMasonryPlacement` script.
- **No sideways scrolling anywhere.**
- **Pagination:** 12 posts per page with numbered page links and Prev and Next. URLs, self-canonicals, page titles and the sitemap stay as they are. No infinite scroll and no "load more" button.

## Content model in Contentful

Created through the Contentful management API, with TypeScript regenerated by `make types`.

### `categoryLanding`, one entry per category, all three required

| Field | Type | Notes |
|---|---|---|
| `category` | Symbol, validated to `events`, `music`, `lifestyle`, unique | Join key to posts |
| `description` | Text | Search description. Replaces `data/categories.json` |
| `intro` | Text, markdown | Optional. Empty means no evergreen layer for categories without their own layout (Lifestyle today). Events still renders its price lists and Music its player and listening links |
| `body` | Text, markdown | Optional longer copy |
| `packages` | Array of links to `servicePackage` | Ordered. Events only |
| `ctaLabel`, `ctaUrl` | Symbol | Optional booking link |
| `rentalHeading` | Symbol | Optional heading over the speaker-rental list. Events only |
| `footnote` | Symbol | Optional short line under the price lists, such as the travel note. Events only |
| `ogImage` | Asset link | Optional |

Category display titles (Music, Events, Lifestyle) stay the `CATEGORY_TITLES` code constant because the top bar, search page and post page need them while rendering. Everything editorial lives in Contentful.

`data/categories.json`, `src/types/categoryConfig.ts` and `src/utils/categoryConfig.ts` are replaced by these entries and deleted with the code that reads them.

### `servicePackage`

| Field | Type | Notes |
|---|---|---|
| `name` | Symbol | |
| `group` | Symbol, validated to `dj`, `speakerRental` | Splits the two price lists |
| `price` | Number | Whole dollars |
| `priceOperated` | Number | Required when `group` is `speakerRental` |
| `priceUnit` | Symbol | Such as "per event" |
| `includes` | Array of Symbol | Rendered as monospace inclusions |

### `brand`

`name`, `kind`, `blurb`, `url`, optional `logo` asset.

### `homePage`, single entry

| Field | Type | Notes |
|---|---|---|
| `lines` | Array of Symbol | Optional. The stacked label lines under the giant word, in order |
| `showNowPlaying` | Boolean | Shows the live audeos.fm line under the stack |
| `hireLinkLabel` | Symbol | The link always points to `/category/events` |
| `seoTitle` | Symbol | Home `<title>` |
| `seoDescription` | Text | Home meta description |

### `author`, two new fields

`resumeUrl` and `brands`, an ordered array of links to `brand`.

### Build-time validation

`getStaticProps` fails the build with a message naming the problem when:

- A category in `CATEGORY_IDS` has no landing entry, or a landing entry names an unknown category.
- A published post's category has no landing entry.
- There is not exactly one `homePage` entry.
- A `speakerRental` package has no `priceOperated`.

This follows the `fallback: false` invariant in `CLAUDE.md`. Missing content must fail loudly with a named entry, never render blank.

### Writes to Contentful

Every proposed entry and field value is shown to the owner for approval before any Contentful write tool runs, per the existing project preference.

## Structured data

- **About page:** an Organization for Audeos, LLC with a founder Person named Audeos, alternate name Ben Petty, image, and `sameAs` from the shared social-links constant plus the resume URL.
- **Events page:** each package as an `Offer` in US dollars inside a `Service` provided by the Organization.
- **Home page:** the existing CollectionPage schema, reading category data from the landing entries instead of the JSON file.

## Delivery

Three pull requests, each in its own worktree, each passing `pnpm format`, `pnpm lint`, `pnpm test` and `make build` before it opens. Each PR checks `CLAUDE.md` for routes, data utilities and architecture notes that need updating.

1. **Visual system and site frame.** Dark-only tokens, Mona Sans width axis, top bar, on-air widget with its shared now-playing hook, footer, giant word component, card, masonry, pagination styling, post page restyle, and removal of `CategoryNav`. No content-model changes. Category titles still come from `data/categories.json`.
2. **Content models with home and category pages.** The four new types and the author fields, `make types`, fetch helpers using the existing promise-cache pattern, build validation, the home stack, live line and SEO fields, the Events price lists, rental section, footnote and booking link, the Music player block and listening row, and deletion of the category JSON config. Contentful entries are created from the copy pass's stand-ins, shown to the owner before any write.
3. **About page and structured data.** The brands section, resume and GitHub links, and the Organization, Person, Service and Offer data.

The copy pass with the owner happens before PRs 2 and 3 are merged.

## Copy pass status (2026-10-12)

Stand-ins for the Contentful entries. None is final until the owner says so; all can change in Contentful later.

- **Home:** title "Audeos" (owner decision). Meta description, for now: "Listen, tune in, or book a DJ set." Stacked line leaning: "MUSIC, EVENTS, LIFESTYLE". A mystery line such as ΕΥΦΡΟΣΥΝΟΣ was floated as just an idea. Open: whether to show the live now-playing line (the corner widget already shows audeos.fm). "DJ FOR HIRE →" link.
- **Events:** intro "Seattle-based DJ for parties, nightlife and private events." Booking link "Book a call →" to a Cal.com inquiry event. Rental heading "Speaker rental". Footnote "Travel is quoted per event."
- **DJ packages:** Party / club night $1,200; Corporate event $1,800; Wedding $3,200; extra hour $250; DJ lighting add-on $150; ceremony & speech recording $150 (inclusions per the copy notes; lighting inventory in issue #154).
- **Speaker rental (per day; gear only includes delivery and pickup):** Pair $250 / $600 with the owner running sound; Pair + sub $450 / $850; Full system $750 / $1,350. No speaker brand names in intro copy.
- **Music:** "Original music, DJ mixes, edits and playlists. Tune in to the live stream on audeos.fm." Listening row: all six music platforms.
- **Category search descriptions:** the current `data/categories.json` descriptions carry over.

## Testing

Per the shared testing rules, only behavior nothing else covers:

- Build validation failures, one case per rule above, with expected messages written from the rules.
- Price formatting and the two-price rental rows.
- Structured data output for the Organization, Person, Service and Offer.
- The now-playing hook's response type guard, which replaces the current unchecked `as NowPlaying` cast.

Tests made redundant by the change are deleted in the same PR, including `CategoryNav` and `categoryConfig` tests. Visual checks happen in the owner's running dev server.

## Reference mockups

The approved mockups live in the brainstorming companion's session folder under `.superpowers/brainstorm/`, which is gitignored. The final home page is `home-v9-even.html`, the phone word sizing is `phone-words-v2.html`, option B. The final giant-word treatment is `kerning-grid-v1.html`, the solid-overlap row at -0.105em, and the cleaned logo check is `svg-clean-check.html`. The Events, Music and About layouts were approved in earlier light-theme screens and carry over to the dark system: `events-v3-site-colors-chrome.html` and `music-about-v2-site-colors-chrome.html`.

## Out of scope

- Cannabis consulting and software services pages.
- A light theme.
- Changes to post URLs, tag URLs or the author slug.
- The booking channel itself. The spec only provides the fields that will point to it.
