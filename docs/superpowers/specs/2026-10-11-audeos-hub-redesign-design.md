# Audeos.com hub redesign

Date: 2026-10-11
Status: design approved in brainstorming, awaiting written-spec review

## Goal

Turn audeos.com from a blog into the front door for Audeos, LLC while keeping the blog. Visitors who search for Audeos, or arrive from a flyer or a profile, should come away impressed, understand what Audeos does, and find the DJ booking information with prices. The site itself is a portfolio piece for frontend design work, so the design must feel deliberate and unlike a template.

Success means:

- A visitor can reach DJ rates and speaker-rental rates from any page in one click.
- Searches for "Audeos" surface a site that clearly identifies Audeos, LLC, its founder and its brands.
- The Events page can rank for "DJ for hire Seattle"-style searches.
- Every existing post, category, tag and author URL keeps working.

## Decisions already made

These were settled with the owner during brainstorming and are not open for redesign in planning.

- **The blog stays.** The evergreen marketing content sits on top of the existing category pages. There is no separate services section and no new top-level routes.
- **Categories carry the evergreen content.** Events holds DJ for hire plus speaker rentals with prices. Music holds releases and audeos.fm. Lifestyle stays a plain archive. The `lifestyle` slug is unchanged.
- **About is the existing author page**, `/author/audeos`, enriched. The author's name stays "Audeos". Brands live on this page.
- **Cannabis consulting and a software services page are out of scope.**
- **All copy is placeholder.** Every headline, intro, package name, inclusion and price is written in a dedicated copy pass with the owner before any public page ships. No copy in mockups or in this spec is final.
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

A huge word anchors the home, category and About pages: AUDEOS, EVENTS, MUSIC, LIFESTYLE.

- Mona Sans at weight 900 and about 82% width, with negative letter spacing so neighboring letters overlap. This mirrors the owner's AUDEOS logo, used for the favicon. The overlap amount approved in the mockup is about -0.075em.
- **Desktop:** one line, sized so it runs off the right edge and is clipped by its container, never scrolled.
- **Phone, AUDEOS only:** on Home and About, AUDEOS stacks as AUD over EOS with overlapping lines, matching the logo. The whole mark is centered on its visible ink, so the left and right gaps match, and EOS sits slightly inset under AUD. Negative letter spacing also shortens each line's box after its last letter, which shifts centered text right. Each line therefore gets trailing space equal to the letter spacing, about 0.075em, so its box matches its ink. The approved mockup measured within two pixels of center. The stack is sized to leave a small margin on each side, as the logo does. AUDEOS is the only word that ever splits.
- **Phone, every other word:** EVENTS, MUSIC, LIFESTYLE and any future word stay on one line, scaled so the whole word fills the container width edge to edge. Nothing is cropped, so short words render taller and long words shorter. The sizing method is a planning decision: container-query units with a per-word ratio, or a maintained fit-text library.
- Trim the text box to the capital height and baseline with `text-box: trim-both cap alphabetic`, then apply equal padding above and below. Browsers without support keep the word, with slightly uneven spacing.
- Post pages do not use the giant word. They use a large title.

### Diagonal hatch

A faint white diagonal hatch, from the xerox-flyer direction, appears in exactly two places:

1. Behind every card's image area until the image loads.
2. Filling the full-width "All N category →" link on hover, in light green, with a light green outline.

The owner rejected hatched spacer bands between sections. Sections are separated by plain rules.

### Motion

Kept minimal and fully disabled under `prefers-reduced-motion`.

- The giant word slides into its crop on page load.
- Navigating between pages hands the giant word off to the next page's word through view transitions, building on the `view-transition` meta tag the site already sets. Unsupported browsers switch instantly.
- Cards fade up as they scroll into view.
- Card photos zoom slightly on hover.
- The on-air dot pulses.

## Site frame, on every page

### Top bar

- **Desktop:** wordmark "Audeos.com", the existing search input, then Events, Music, Lifestyle and About links, then the on-air widget.
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
3. Intro paragraph from Contentful, with one plain text link, "DJ FOR HIRE →", to `/category/events`. No dot, no "available for hire" label and no resume link.
4. Three category blocks in this order: Events, Music, Lifestyle. Each has:
   - The category name in the condensed giant-word style at section size, with a small "See all N →" link beside it.
   - The six newest posts as masonry cards.
   - A full-width bordered link in the condensed style, "All N events →".
5. Footer.

The `NowPlayingCard` leaves the home page. The homepage CollectionPage JSON-LD and the feed generation stay.

### Category pages, `/category/[slug]` and its pagination

- Page 1 of Events and Music shows the evergreen layer above the archive. Lifestyle and every later page show only the giant word and archive.
- **Events evergreen layer:** giant EVENTS, intro, the DJ price list, the speaker-rental price list, and a booking block. The booking link's label and URL are Contentful fields, because the booking channel is still undecided.
- **Price list layout:** rows, not cards. Each row has the package name, inclusions in small monospace and a large price. Speaker rentals show two prices per row: "Gear only" and "With me", meaning the owner runs the sound.
- **Music evergreen layer:** giant MUSIC, intro, an audeos.fm player block, a row of listening links, then the archive. The player block replaces the current `NowPlayingCard` styling under the new visual system.
- The existing `CategoryNav` row is removed, since the top bar now links every category.

### About, `/author/audeos`

Giant AUDEOS, photo, bio from the author entry, links to the resume on ben-petty.com and to GitHub, the brands as rows in the price-list style with a link out, then the profile links. Brands: The North West Clothing, Crisis Clothing, Northwest Local Cannabis, DJ Audeos and audeos.fm. The final list and blurbs are part of the copy pass.

### Posts, `/post/[slug]`

Large title in Mona Sans, a monospace line with date and category, the cover image, the body, and tags. All embeds, galleries and maps behave as today.

### Tag, search and chronological archive pages

They use the same top bar, cards, masonry and pagination as the category pages, without an evergreen layer.

## Cards, masonry and pagination

- **One card everywhere:** the whole image at its natural aspect ratio with no crop, then a monospace line with the date and category in light green, then the title. The card has clear spacing below the image and between date and title.
- **Masonry:** three columns on desktop and two on phones. Cards fill the shortest column in order, so the newest posts sit across the top row. The page's DOM order stays newest first for search engines and screen readers.
- **No sideways scrolling anywhere.** The owner found horizontal strips hard to discover on both phone and desktop.
- **Image dimensions** come from the Contentful asset's `file.details.image` width and height at build time. They set each card's aspect ratio before the image loads, so the layout does not shift.
- **Pagination:** 12 posts per page with numbered page links and Prev and Next, as today. URLs, self-canonicals, page titles and the sitemap stay as they are. No infinite scroll and no "load more" button.

The masonry placement approach is a planning decision. Compare native CSS masonry support at build time, a maintained masonry library, and a small placement script over CSS columns as the no-JavaScript fallback. Pick per the owner's "established solutions first" rule.

## Content model in Contentful

Created through the Contentful management API, with TypeScript regenerated by `make types`.

### `categoryLanding`, one entry per category, all three required

| Field | Type | Notes |
|---|---|---|
| `category` | Symbol, validated to `events`, `music`, `lifestyle`, unique | Join key to posts |
| `title` | Symbol | Replaces `title` in `data/categories.json` |
| `description` | Text | Search description. Replaces `data/categories.json` |
| `intro` | Text, markdown | Optional. Empty means no evergreen layer |
| `body` | Text, markdown | Optional longer copy |
| `packages` | Array of links to `servicePackage` | Ordered. Events only |
| `ctaLabel`, `ctaUrl` | Symbol | Optional booking link |
| `ogImage` | Asset link | Optional |

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

`intro` as markdown and `hireLinkLabel`. The hire link always points to `/category/events`.

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

Three pull requests, each in its own worktree, each passing `yarn format`, `yarn lint`, `yarn typecheck`, `yarn test` and `yarn build` before it opens. Each PR checks `CLAUDE.md` for routes, data utilities and architecture notes that need updating.

1. **Visual system and site frame.** Dark-only tokens, Mona Sans width axis, top bar, on-air widget with its shared now-playing hook, footer, giant word component, card, masonry, pagination styling, post page restyle, and removal of `CategoryNav`. No content-model changes. Category titles still come from `data/categories.json`.
2. **Content models with home and category pages.** The four new types and the author fields, `make types`, fetch helpers using the existing promise-cache pattern, build validation, the home intro and category blocks, the Events price lists and booking block, the Music player block, and deletion of the category JSON config. Contentful entries are created only after the copy pass.
3. **About page and structured data.** The brands section, resume and GitHub links, and the Organization, Person, Service and Offer data.

The copy pass with the owner happens before PRs 2 and 3 are merged.

## Testing

Per the shared testing rules, only behavior nothing else covers:

- Masonry placement order: newest posts fill the top row left to right, and DOM order stays newest first.
- Build validation failures, one case per rule above, with expected messages written from the rules.
- Price formatting and the two-price rental rows.
- Structured data output for the Organization, Person, Service and Offer.
- The now-playing hook's response type guard, which replaces the current unchecked `as NowPlaying` cast.

Tests made redundant by the change are deleted in the same PR, including `CategoryNav` and `categoryConfig` tests. Visual checks happen in the owner's running dev server.

## Reference mockups

The approved mockups live in the brainstorming companion's session folder under `.superpowers/brainstorm/`, which is gitignored. The final home page is `home-v9-even.html`, the phone word sizing is `phone-words-v2.html`, option B, and the centered stack is `stack-centered-v3.html`. The Events, Music and About layouts were approved in earlier light-theme screens and carry over to the dark system: `events-v3-site-colors-chrome.html` and `music-about-v2-site-colors-chrome.html`.

## Out of scope

- Cannabis consulting and software services pages.
- A light theme.
- Changes to post URLs, tag URLs or the author slug.
- The booking channel itself. The spec only provides the fields that will point to it.
