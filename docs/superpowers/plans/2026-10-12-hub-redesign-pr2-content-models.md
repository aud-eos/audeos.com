# Hub redesign PR 2: content models with home and category pages — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the evergreen copy and prices into Contentful and render them: the home page's stacked lines, optional live line and SEO fields; the Events price lists, rental section, footnote and booking link; the Music player block and listening row. Delete `data/categories.json` and everything that reads it.

**Architecture:** A Contentful migration file creates `servicePackage`, `categoryLanding`, `homePage` and `brand`, plus two `author` fields; `make types` regenerates the TypeScript types. Fetching follows the existing promise-cache pattern in `contentfulUtils.ts`. A small `siteContent` module maps entries into plain view models and validates them, failing the build loudly with a named entry. Pages receive those view models as props. Category titles (Music, Events, Lifestyle) stay a code constant because the top bar, search page and post page need them while rendering.

**Tech Stack:** Next.js 16 pages router with static export, React 19, TypeScript, SCSS modules, Vitest with Testing Library, Contentful CDA (`contentful` 11) and the Contentful CLI's `space migration` command, pnpm 12 via mise.

**Spec:** `docs/superpowers/specs/2026-10-11-audeos-hub-redesign-design.md` (merged in #150, revised in #160). This plan covers the spec's Delivery item 2 only. The About page, brands section and structured data are PR 3.

## Global Constraints

- **Copy:** Contentful entries use the spec's "Copy pass status" stand-ins. No line is final; the owner edits them in Contentful later. Never invent copy beyond those stand-ins.
- **Contentful writes:** every proposed content type change and every entry value is shown to the owner for approval before any write (migration run or MCP write tool). Only the controller session does Contentful writes, never a subagent.
- **Entity framing:** copy describes Audeos as an entity, not a person, and never limits it to Seattle.
- **Order:** categories render Music, Events, Lifestyle everywhere (`CATEGORY_IDS`).
- **Dark mode only.** Use only the existing tokens: `--ink`, `--paper`, `--mute`, `--rule`, `--accent`, `--hatch`, `--font-mona-sans`, `--font-mono`. No purple, no gradients in new or restyled UI.
- **No disclosure UI** (accordions, details/summary, collapsing menus).
- **TypeScript:** no `as` assertions (use guards or `satisfies`), no single-character identifiers, no `eslint-disable`.
- **Fail loudly:** missing or invalid content throws at build time with a message naming the entry or category. No silent fallbacks.
- **Tests:** only behavior nothing else covers, through public interfaces, mocking only network, clock and randomness. Delete tests the change makes redundant.
- **Checks before the PR:** `pnpm format`, `pnpm lint`, `pnpm test`, `make build`. The worktree needs the owner to link `.env` for `make types`, `make content-migration` and `make build`; ask, never read or copy it.
- **No dev server.** Visual checks happen in the owner's running server.

## Review Focus

1. **A published post whose category has no `categoryLanding` entry.** The build must fail naming the category, not render a page without a description. Test owned by Task 3.
2. **A speaker-rental package without its "With me" price.** The build must fail naming the package, not render an empty price cell. Test owned by Task 3.
3. **A `homePage` entry with no lines.** The home page must render the giant word and the hire link with no empty stack element. Test owned by Task 5.
4. **audeos.fm down while the home live line is switched on.** The live line must disappear quietly while the rest of the page renders; the corner widget already signals the stream. Test owned by Task 5.
5. **A category landing with no packages, CTA or footnote (Music) or no intro at all (Lifestyle).** Music must render only its own blocks, and Lifestyle must render no evergreen layer. Test owned by Task 6.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `contentful/migrations/2026-10-12-hub-content-models.cjs` | Create | Content types and author fields, run by the Contentful CLI |
| `Makefile` | Modify | `content-migration` target |
| `src/types/contentful/*` | Regenerate | `make types` output for the new types |
| `src/constants.ts` | Modify | Content type ids, `CategoryId`, `CATEGORY_TITLES`, `HIRE_PATH` |
| `src/utils/contentfulUtils.ts` | Modify | `getCategoryLandings()`, `getHomePages()` with the promise cache |
| `src/lib/siteContent.ts` | Create | View-model types, `buildLandingMap`, `buildHomeContent`, entry adapters, `loadSiteContent()` |
| `src/utils/formatPrice.ts` | Create | Whole dollars to "$1,200" |
| `src/utils/categoryTitle.ts` | Modify | Reads `CATEGORY_TITLES` |
| `src/lib/navLinks.ts`, `src/components/Layout/TopNav.tsx` | Modify | Titles from the constant |
| `src/lib/homepageSchema.ts` | Modify | Descriptions from the landing map |
| `src/components/Home/CategoryPostSections.tsx` | Modify | Titles from the constant |
| `src/components/FilteredArchive/*StaticProps.ts`, `FilteredArchive.tsx` | Modify | Landing content, validation, evergreen layer slot |
| `src/pages/index.tsx`, `src/pages/category/[slug].tsx`, `src/pages/category/[slug]/page/[page].tsx` | Modify | Home content, paths from `CATEGORY_IDS` |
| `src/components/Home/HomeIntro.tsx`, `src/components/Home/LiveLine.tsx` | Create | Stacked lines, live line, hire link |
| `src/components/Landing/PriceList.tsx` | Create | Price rows, one or two prices |
| `src/components/Landing/EventsLanding.tsx`, `MusicLanding.tsx` | Create | Evergreen layers |
| `src/components/Markdown.tsx` | Reuse | Renders intro and body markdown |
| `src/lib/socialLinks.ts` | Modify | Short `name` per link, `LISTENING_LINKS` |
| `src/components/NowPlaying/NowPlayingCard.module.scss` | Modify | Restyled to the dark tokens |
| `src/styles/Landing.module.scss`, `src/styles/Home.module.scss` | Create / Modify | New layer and stack styles |
| `data/categories.json`, `src/types/categoryConfig.ts`, `src/utils/categoryConfig.ts`, `src/__tests__/utils/categoryConfig.test.ts` | Delete | Replaced by Contentful and the constant |
| `CLAUDE.md` | Modify | Data flow, invariants, commands |

## Setup

- [ ] **Create the worktree** from the repo root:

```bash
git fetch origin
git worktree add -b feat/hub-content-models ../audeos.com.worktrees/hub-content-models origin/main
cd ../audeos.com.worktrees/hub-content-models
git branch --unset-upstream
pnpm install --frozen-lockfile
pnpm test
```

Expected: install succeeds and the suite passes before any change.

- [ ] **Ask the owner to link `.env`** (the assistant must not touch it):

```
! ln -s /Users/benny/dev/audeos.com/.env /Users/benny/dev/audeos.com.worktrees/hub-content-models/.env
```

---
### Task 1: Content model migration and regenerated types (owner-gated)

The controller runs this task, not a subagent: it writes to Contentful. Steps 1–3 are code; step 4 needs the owner's approval; steps 5–6 run only after the migration succeeds.

**Files:**
- Create: `contentful/migrations/2026-10-12-hub-content-models.cjs`
- Modify: `Makefile` (new `content-migration` target)
- Modify: `src/constants.ts` (content type ids)
- Regenerate: `src/types/contentful/*` via `make types`

**Interfaces:**
- Produces Contentful content types `servicePackage`, `categoryLanding`, `homePage`, `brand`, and `author.resumeUrl` / `author.brands`.
- Produces generated types `TypeServicePackageSkeleton`, `TypeCategoryLandingSkeleton`, `TypeHomePageSkeleton`, `TypeBrandSkeleton` (exported from `src/types/contentful/index.ts`), and constants `CONTENT_TYPE_CATEGORY_LANDING = "categoryLanding"`, `CONTENT_TYPE_HOME_PAGE = "homePage"`.

- [ ] **Step 1: Write the migration** at `contentful/migrations/2026-10-12-hub-content-models.cjs`. It uses the Contentful migration API, which the Contentful CLI (`contentful space migration`, already a devDependency) runs:

```js
// Hub redesign PR 2 content model. Run with:
//   make content-migration FILE=contentful/migrations/2026-10-12-hub-content-models.cjs
module.exports = function( migration ) {
  const servicePackage = migration.createContentType( "servicePackage" )
    .name( "Service package" )
    .displayField( "name" )
    .description( "One row in an Events price list" );
  servicePackage.createField( "name" ).name( "Name" ).type( "Symbol" ).required( true );
  servicePackage.createField( "group" ).name( "Group" ).type( "Symbol" ).required( true )
    .validations( [ { in: [ "dj", "speakerRental" ] } ] );
  servicePackage.createField( "price" ).name( "Price (whole dollars)" ).type( "Integer" ).required( true );
  servicePackage.createField( "priceOperated" ).name( "Price with the owner running sound (rentals)" ).type( "Integer" );
  servicePackage.createField( "priceUnit" ).name( "Price unit" ).type( "Symbol" ).required( true );
  servicePackage.createField( "includes" ).name( "Includes" ).type( "Array" ).items({ type: "Symbol" });

  const categoryLanding = migration.createContentType( "categoryLanding" )
    .name( "Category landing" )
    .displayField( "category" )
    .description( "Evergreen copy above a category archive" );
  categoryLanding.createField( "category" ).name( "Category" ).type( "Symbol" ).required( true )
    .validations( [ { unique: true }, { in: [ "music", "events", "lifestyle" ] } ] );
  categoryLanding.createField( "description" ).name( "Search description" ).type( "Text" ).required( true );
  categoryLanding.createField( "intro" ).name( "Intro (markdown)" ).type( "Text" );
  categoryLanding.createField( "body" ).name( "Body (markdown)" ).type( "Text" );
  categoryLanding.createField( "packages" ).name( "Packages" ).type( "Array" )
    .items({ type: "Link", linkType: "Entry", validations: [ { linkContentType: [ "servicePackage" ] } ] });
  categoryLanding.createField( "rentalHeading" ).name( "Rental heading" ).type( "Symbol" );
  categoryLanding.createField( "footnote" ).name( "Footnote" ).type( "Symbol" );
  categoryLanding.createField( "ctaLabel" ).name( "Booking link label" ).type( "Symbol" );
  categoryLanding.createField( "ctaUrl" ).name( "Booking link URL" ).type( "Symbol" );
  categoryLanding.createField( "ogImage" ).name( "Social image" ).type( "Link" ).linkType( "Asset" );

  const homePage = migration.createContentType( "homePage" )
    .name( "Home page" )
    .displayField( "seoTitle" )
    .description( "Single entry: the home page's stacked lines and SEO" );
  homePage.createField( "seoTitle" ).name( "Page title" ).type( "Symbol" ).required( true );
  homePage.createField( "seoDescription" ).name( "Meta description" ).type( "Text" ).required( true );
  homePage.createField( "lines" ).name( "Stacked lines" ).type( "Array" ).items({ type: "Symbol" });
  homePage.createField( "showNowPlaying" ).name( "Show the live now-playing line" ).type( "Boolean" ).required( true );
  homePage.createField( "hireLinkLabel" ).name( "Hire link label" ).type( "Symbol" ).required( true );

  const brand = migration.createContentType( "brand" )
    .name( "Brand" )
    .displayField( "name" )
    .description( "A brand shown on the About page (used in PR 3)" );
  brand.createField( "name" ).name( "Name" ).type( "Symbol" ).required( true );
  brand.createField( "kind" ).name( "Kind" ).type( "Symbol" );
  brand.createField( "blurb" ).name( "Blurb" ).type( "Text" );
  brand.createField( "url" ).name( "URL" ).type( "Symbol" );
  brand.createField( "logo" ).name( "Logo" ).type( "Link" ).linkType( "Asset" );

  const author = migration.editContentType( "author" );
  author.createField( "resumeUrl" ).name( "Resume URL" ).type( "Symbol" );
  author.createField( "brands" ).name( "Brands" ).type( "Array" )
    .items({ type: "Link", linkType: "Entry", validations: [ { linkContentType: [ "brand" ] } ] });
};
```

- [ ] **Step 2: Add the Makefile target** after `types:`. It fails loudly when a variable is missing instead of defaulting:

```make
# Run a Contentful migration file against the configured space and environment.
# Usage: make content-migration FILE=contentful/migrations/<file>.cjs
content-migration:
	$(if $(FILE),,$(error FILE is required, e.g. FILE=contentful/migrations/2026-10-12-hub-content-models.cjs))
	$(if $(CONTENTFUL_SPACE_ID),,$(error CONTENTFUL_SPACE_ID is not set))
	$(if $(CONTENTFUL_ENVIRONMENT),,$(error CONTENTFUL_ENVIRONMENT is not set))
	$(if $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN),,$(error CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN is not set))
	@pnpm exec contentful space migration \
		--space-id $(CONTENTFUL_SPACE_ID) \
		--environment-id $(CONTENTFUL_ENVIRONMENT) \
		--management-token $(CONTENTFUL_MANAGEMENT_API_ACCESS_TOKEN) \
		$(FILE)
```

The CLI prints the planned changes and asks for confirmation before applying them. Do not pass `--yes`.

- [ ] **Step 3: Add the content type ids** to `src/constants.ts` next to `CONTENT_TYPE_AUTHOR`:

```ts
export const CONTENT_TYPE_CATEGORY_LANDING = "categoryLanding";
export const CONTENT_TYPE_HOME_PAGE = "homePage";
```

- [ ] **Step 4: Owner approval, then run.** Show the owner the migration file's content types and fields as a table. After an explicit yes, run `make content-migration FILE=contentful/migrations/2026-10-12-hub-content-models.cjs` and confirm the CLI's own prompt. Expected: "Migration successful".

- [ ] **Step 5: Regenerate types:** `make types`. Expected: new files `TypeCategoryLanding.ts`, `TypeServicePackage.ts`, `TypeHomePage.ts`, `TypeBrand.ts`, an updated `TypeAuthor.ts` and `index.ts` in `src/types/contentful/`. Add the new skeletons to `src/types/index.ts` alongside the existing two re-exports:

```ts
export type { TypeCategoryLanding, TypeCategoryLandingFields, TypeCategoryLandingSkeleton } from "./contentful/TypeCategoryLanding";
export type { TypeServicePackage, TypeServicePackageFields, TypeServicePackageSkeleton } from "./contentful/TypeServicePackage";
export type { TypeHomePage, TypeHomePageFields, TypeHomePageSkeleton } from "./contentful/TypeHomePage";
```

Do not commit `contentful/export.json` (it's gitignored and embeds a token).

- [ ] **Step 6: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: PASS (nothing reads the new types yet).

```bash
git add contentful/migrations Makefile src/constants.ts src/types
git commit -m "feat: content model for category landings, service packages, home page and brands"
```

---

### Task 2: Seed the entries (owner-gated)

The controller runs this task: it writes to Contentful through the Contentful MCP tools.

**Files:** none (Contentful only).

**Interfaces:**
- Produces three published `categoryLanding` entries (music, events, lifestyle), one published `homePage` entry and the published `servicePackage` entries the Events landing links to, in display order.

- [ ] **Step 1: Show the owner every proposed entry** as tables, using the spec's "Copy pass status" values:

| `homePage` field | Value |
|---|---|
| seoTitle | Audeos |
| seoDescription | Listen, tune in, or book a DJ set. |
| lines | MUSIC, EVENTS, LIFESTYLE |
| showNowPlaying | false (open question; flip in Contentful anytime) |
| hireLinkLabel | DJ FOR HIRE → |

| `categoryLanding` | description | intro | packages | rentalHeading | footnote | ctaLabel / ctaUrl |
|---|---|---|---|---|---|---|
| music | Releases, edits, mixes, and curated playlists by DJ Audeos. | Original music, DJ mixes, edits and playlists. Tune in to the live stream on audeos.fm. | — | — | — | — |
| events | DJ performances, nightlife recaps, and event promotion. | Seattle-based DJ for parties, nightlife and private events. | the nine below, in order | Speaker rental | Travel is quoted per event. | Book a call → / the owner's Cal.com inquiry URL (ask for it; issue #155) |
| lifestyle | Visual art, merch, plants, and other interests. | — | — | — | — | — |

| `servicePackage` | group | price | priceOperated | priceUnit | includes |
|---|---|---|---|---|---|
| Party / club night | dj | 1200 | — | per event | Up to 4 hrs · Rane One · 2× K12 + K Sub · 1 wireless mic |
| Corporate event | dj | 1800 | — | per event | Up to 4 hrs · Rane One · full system with K8 monitors · DJ lighting · 2 Shure SLX-D wireless mics · announcements |
| Wedding | dj | 3200 | — | per event | Up to 6 hrs · ceremony, cocktail hour, reception · full system · DJ lighting · 2 wireless mics · MC · planning call |
| Extra hour | dj | 250 | — | per hour | — |
| DJ lighting | dj | 150 | — | add-on | For party / club night |
| Ceremony & speech recording | dj | 150 | — | add-on | Recorded on the Denon DN-300R, delivered as audio files |
| Pair | speakerRental | 250 | 600 | per day | 2× K12, stands · 2 Shure SM58 · 2 mic stands |
| Pair + sub | speakerRental | 450 | 850 | per day | 2× K12, K Sub, stands · mic rack (Denon 12-ch mixer, 2 Shure SLX-D wireless) · 2 SM58 · mic stands |
| Full system | speakerRental | 750 | 1350 | per day | 4× K12, K Sub, 2× K8 monitors, stands · mic rack · 2 SM58 · 4 mic stands |

(Each `includes` item is one array element; the "·" separators above mark element boundaries.)

- [ ] **Step 2: After explicit approval, create and publish.** Create the nine `servicePackage` entries first, then the three `categoryLanding` entries (events links the packages in the order above), then the `homePage` entry. Publish each. The Contentful MCP caps mutations at five entries per call; batch accordingly. Report every created entry id.

- [ ] **Step 3: Record the entry ids** in the ledger for the PR description. Task 4's `make build` proves the delivery API returns them (the build fails loudly if any are missing).

---

### Task 3: Fetch helpers, view models and build validation

**Files:**
- Modify: `src/utils/contentfulUtils.ts`
- Modify: `src/constants.ts`
- Create: `src/lib/siteContent.ts`
- Create: `src/utils/formatPrice.ts`
- Test: `src/__tests__/lib/siteContent.test.ts`, `src/__tests__/utils/formatPrice.test.ts`

**Interfaces:**
- Consumes: generated skeletons from Task 1; `CATEGORY_IDS` from `@/constants`.
- Produces in `@/constants`: `export type CategoryId = ( typeof CATEGORY_IDS )[number];`, `export const CATEGORY_TITLES: Record<CategoryId, string>`, `export const HIRE_PATH = "/category/events";`, `export function isCategoryId( value: string ): value is CategoryId`.
- Produces in `@/utils/contentfulUtils`: `getCategoryLandings(): Promise<CategoryLandings>`, `getHomePages(): Promise<HomePages>` and their collection/entry types.
- Produces in `@/lib/siteContent`: `PricePackage`, `LandingContent`, `LandingMap`, `HomeContent`, `LandingInput`, `PackageInput`, `HomeInput`, `buildLandingMap( landings: LandingInput[], postCategories: ( string | undefined )[] ): LandingMap`, `buildHomeContent( homes: HomeInput[] ): HomeContent`, `loadSiteContent(): Promise<{ landings: LandingMap; home: HomeContent }>`.
- Produces in `@/utils/formatPrice`: `formatPrice( dollars: number ): string`.

- [ ] **Step 1: Write the failing tests** at `src/__tests__/lib/siteContent.test.ts`. The pure functions take plain inputs, so fixtures need no Contentful entry shapes:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock( "@/utils/contentfulUtils", () => ({}) );

import { buildHomeContent, buildLandingMap, LandingInput, PackageInput } from "@/lib/siteContent";

const djPackage: PackageInput = {
  id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: undefined, priceUnit: "per event", includes: [ "Up to 4 hrs" ],
};
const rentalPackage: PackageInput = {
  id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [],
};

function landing( category: string, overrides: Partial<LandingInput> = {} ): LandingInput {
  return { category, description: `${category} posts`, intro: undefined, body: undefined, packages: [], rentalHeading: undefined, footnote: undefined, ctaLabel: undefined, ctaUrl: undefined, ogImageUrl: undefined, ...overrides };
}

const allThree = [ landing( "music" ), landing( "events", { packages: [ djPackage, rentalPackage ] } ), landing( "lifestyle" ) ];

describe( "buildLandingMap", () => {
  it( "keys landings by category and keeps package order", () => {
    const map = buildLandingMap( allThree, [ "music", "events" ] );
    expect( map.events.packages.map( pkg => pkg.name ) ).toEqual( [ "Party / club night", "Pair" ] );
    expect( map.music.description ).toBe( "music posts" );
  });

  it( "fails when a category has no landing entry", () => {
    expect( () => buildLandingMap( [ landing( "music" ), landing( "events" ) ], [] ) ).toThrow( /lifestyle/ );
  });

  it( "fails when a landing names an unknown category", () => {
    expect( () => buildLandingMap( [ ...allThree, landing( "podcasts" ) ], [] ) ).toThrow( /podcasts/ );
  });

  it( "fails when a published post's category has no landing", () => {
    expect( () => buildLandingMap( allThree, [ "music", "podcasts" ] ) ).toThrow( /podcasts/ );
  });

  it( "fails when a published post has no category", () => {
    expect( () => buildLandingMap( allThree, [ "music", undefined ] ) ).toThrow( /missing a category/ );
  });

  it( "fails when a booking link has a label but no URL", () => {
    expect( () => buildLandingMap( [ landing( "music" ), landing( "events", { ctaLabel: "Book a call →" }), landing( "lifestyle" ) ], [] ) )
      .toThrow( /events/ );
  });

  it( "fails when a speaker-rental package has no With me price", () => {
    const broken = { ...rentalPackage, priceOperated: undefined };
    expect( () => buildLandingMap( [ landing( "music" ), landing( "events", { packages: [ broken ] } ), landing( "lifestyle" ) ], [] ) )
      .toThrow( /Pair/ );
  });
});

describe( "buildHomeContent", () => {
  const home = { seoTitle: "Audeos", seoDescription: "Listen.", lines: [ "MUSIC, EVENTS, LIFESTYLE" ], showNowPlaying: false, hireLinkLabel: "DJ FOR HIRE →" };

  it( "maps the single entry", () => {
    expect( buildHomeContent( [ home ] ) ).toEqual( home );
  });

  it( "treats missing lines as none", () => {
    expect( buildHomeContent( [ { ...home, lines: undefined } ] ).lines ).toEqual( [] );
  });

  it( "fails unless there is exactly one home page entry", () => {
    expect( () => buildHomeContent( [] ) ).toThrow( /exactly one/ );
    expect( () => buildHomeContent( [ home, home ] ) ).toThrow( /exactly one/ );
  });
});
```

And `src/__tests__/utils/formatPrice.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { formatPrice } from "@/utils/formatPrice";

describe( "formatPrice", () => {
  it( "formats whole dollars with a thousands separator and no cents", () => {
    expect( formatPrice( 1200 ) ).toBe( "$1,200" );
    expect( formatPrice( 250 ) ).toBe( "$250" );
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/lib/siteContent.test.ts src/__tests__/utils/formatPrice.test.ts`
Expected: FAIL, cannot resolve `@/lib/siteContent` and `@/utils/formatPrice`.

- [ ] **Step 3: Add the constants** to `src/constants.ts` below `CATEGORY_IDS`:

```ts
export type CategoryId = ( typeof CATEGORY_IDS )[number];
// Titles are code, not content: the top bar, search page and post page need them while rendering.
export const CATEGORY_TITLES: Record<CategoryId, string> = { music: "Music", events: "Events", lifestyle: "Lifestyle" };
export const HIRE_PATH = "/category/events";

export function isCategoryId( value: string ): value is CategoryId {
  return CATEGORY_IDS.some( categoryId => categoryId === value );
}
```

- [ ] **Step 4: Add the fetch helpers** to `src/utils/contentfulUtils.ts`, following the existing promise-cache pattern. Import the new skeletons from `@/types` and the two content type ids from `@/constants`:

```ts
export type CategoryLandings = EntryCollection<TypeCategoryLandingSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type CategoryLanding = Entry<TypeCategoryLandingSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type HomePages = EntryCollection<TypeHomePageSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;
export type HomePage = Entry<TypeHomePageSkeleton, "WITHOUT_UNRESOLVABLE_LINKS", string>;

let categoryLandingsPromise: Promise<CategoryLandings> | null = null;
let homePagesPromise: Promise<HomePages> | null = null;

export const getCategoryLandings = async (): Promise<CategoryLandings> => {
  if( !categoryLandingsPromise ) {
    categoryLandingsPromise = client.withoutUnresolvableLinks.getEntries<TypeCategoryLandingSkeleton>({
      content_type: CONTENT_TYPE_CATEGORY_LANDING,
      include: 2,
      limit: 100,
    });
  }
  return categoryLandingsPromise;
};

export const getHomePages = async (): Promise<HomePages> => {
  if( !homePagesPromise ) {
    homePagesPromise = client.withoutUnresolvableLinks.getEntries<TypeHomePageSkeleton>({
      content_type: CONTENT_TYPE_HOME_PAGE,
      limit: 10,
    });
  }
  return homePagesPromise;
};
```

Update the cache comment's call count ("Cuts per-build CDA calls from ~200 to 5").

- [ ] **Step 5: Implement `src/utils/formatPrice.ts`**

```ts
const DOLLARS = new Intl.NumberFormat( "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatPrice( dollars: number ): string {
  return DOLLARS.format( dollars );
}
```

- [ ] **Step 6: Implement `src/lib/siteContent.ts`**

```ts
import { CategoryId, isCategoryId } from "@/constants";
import { CategoryLanding, getBlogPosts, getCategoryLandings, getHomePages, HomePage } from "@/utils/contentfulUtils";

export type PackageGroup = "dj" | "speakerRental";

export interface PricePackage {
  id: string;
  name: string;
  group: PackageGroup;
  price: number;
  priceOperated: number | null;
  priceUnit: string;
  includes: string[];
}

export interface LandingContent {
  category: CategoryId;
  description: string;
  intro: string | null;
  body: string | null;
  packages: PricePackage[];
  rentalHeading: string | null;
  footnote: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ogImageUrl: string | null;
}

export type LandingMap = Record<CategoryId, LandingContent>;

export interface HomeContent {
  seoTitle: string;
  seoDescription: string;
  lines: string[];
  showNowPlaying: boolean;
  hireLinkLabel: string;
}

// Plain inputs, so validation is testable without Contentful entry shapes.
export interface PackageInput {
  id: string;
  name: string;
  group: string;
  price: number;
  priceOperated: number | undefined;
  priceUnit: string;
  includes: string[] | undefined;
}

export interface LandingInput {
  category: string;
  description: string;
  intro: string | undefined;
  body: string | undefined;
  packages: PackageInput[];
  rentalHeading: string | undefined;
  footnote: string | undefined;
  ctaLabel: string | undefined;
  ctaUrl: string | undefined;
  ogImageUrl: string | undefined;
}

export interface HomeInput {
  seoTitle: string;
  seoDescription: string;
  lines: string[] | undefined;
  showNowPlaying: boolean;
  hireLinkLabel: string;
}

function isPackageGroup( value: string ): value is PackageGroup {
  return value === "dj" || value === "speakerRental";
}

function toPricePackage( input: PackageInput ): PricePackage {
  if( !isPackageGroup( input.group ) ) {
    throw new Error( `Service package "${input.name}" has unknown group "${input.group}"` );
  }
  if( input.group === "speakerRental" && input.priceOperated === undefined ) {
    throw new Error( `Speaker-rental package "${input.name}" has no "With me" price (priceOperated)` );
  }
  return {
    id: input.id,
    name: input.name,
    group: input.group,
    price: input.price,
    priceOperated: input.priceOperated ?? null,
    priceUnit: input.priceUnit,
    includes: input.includes ?? [],
  };
}

export function buildLandingMap( landings: LandingInput[], postCategories: ( string | undefined )[] ): LandingMap {
  const byCategory = new Map<CategoryId, LandingContent>();
  for( const landing of landings ) {
    if( !isCategoryId( landing.category ) ) {
      throw new Error( `Category landing names unknown category "${landing.category}"` );
    }
    if( ( landing.ctaLabel === undefined ) !== ( landing.ctaUrl === undefined ) ) {
      throw new Error( `Category landing "${landing.category}" needs both a booking link label and URL, or neither` );
    }
    byCategory.set( landing.category, {
      category: landing.category,
      description: landing.description,
      intro: landing.intro ?? null,
      body: landing.body ?? null,
      packages: landing.packages.map( toPricePackage ),
      rentalHeading: landing.rentalHeading ?? null,
      footnote: landing.footnote ?? null,
      ctaLabel: landing.ctaLabel ?? null,
      ctaUrl: landing.ctaUrl ?? null,
      ogImageUrl: landing.ogImageUrl ?? null,
    });
  }
  for( const category of postCategories ) {
    if( category === undefined ) {
      throw new Error( "A published post is missing a category. Make the Contentful field required and backfill it." );
    }
    if( !isCategoryId( category ) || !byCategory.has( category ) ) {
      throw new Error( `Category "${category}" is set on a published post but has no category landing entry` );
    }
  }
  const landingFor = ( categoryId: CategoryId ): LandingContent => {
    const landing = byCategory.get( categoryId );
    if( !landing ) {
      throw new Error( `Category "${categoryId}" has no category landing entry in Contentful` );
    }
    return landing;
  };
  return { music: landingFor( "music" ), events: landingFor( "events" ), lifestyle: landingFor( "lifestyle" ) } satisfies LandingMap;
}

export function buildHomeContent( homes: HomeInput[] ): HomeContent {
  if( homes.length !== 1 ) {
    throw new Error( `Expected exactly one home page entry in Contentful, found ${homes.length}` );
  }
  const [ home ] = homes;
  return { ...home, lines: home.lines ?? [] };
}

function toLandingInput( entry: CategoryLanding ): LandingInput {
  const fields = entry.fields;
  return {
    category: fields.category,
    description: fields.description,
    intro: fields.intro,
    body: fields.body,
    packages: ( fields.packages ?? [] ).flatMap( packageEntry => packageEntry ? [ {
      id: packageEntry.sys.id,
      name: packageEntry.fields.name,
      group: packageEntry.fields.group,
      price: packageEntry.fields.price,
      priceOperated: packageEntry.fields.priceOperated,
      priceUnit: packageEntry.fields.priceUnit,
      includes: packageEntry.fields.includes,
    } ] : [] ),
    rentalHeading: fields.rentalHeading,
    footnote: fields.footnote,
    ctaLabel: fields.ctaLabel,
    ctaUrl: fields.ctaUrl,
    ogImageUrl: fields.ogImage?.fields.file?.url,
  };
}

function toHomeInput( entry: HomePage ): HomeInput {
  return { ...entry.fields };
}

let siteContentPromise: Promise<{ landings: LandingMap; home: HomeContent }> | null = null;

// One validated load per build, shared by every page's getStaticProps.
export function loadSiteContent(): Promise<{ landings: LandingMap; home: HomeContent }> {
  if( !siteContentPromise ) {
    siteContentPromise = Promise.all( [ getBlogPosts(), getCategoryLandings(), getHomePages() ] )
      .then( ( [ posts, landingEntries, homeEntries ] ) => ({
        landings: buildLandingMap( landingEntries.items.map( toLandingInput ), posts.items.map( post => post.fields.category ) ),
        home: buildHomeContent( homeEntries.items.map( toHomeInput ) ),
      }) );
  }
  return siteContentPromise;
}
```

If the generated field types differ from the ones assumed here (for example `group` typed as a literal union, or `packages` items not optional), adjust `toLandingInput` with narrowing — never `as`.

- [ ] **Step 7: Run the tests**

Run: `pnpm vitest run src/__tests__/lib/siteContent.test.ts src/__tests__/utils/formatPrice.test.ts`
Expected: PASS.

- [ ] **Step 8: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: PASS.

```bash
git add src/constants.ts src/utils/contentfulUtils.ts src/lib/siteContent.ts src/utils/formatPrice.ts src/__tests__/lib/siteContent.test.ts src/__tests__/utils/formatPrice.test.ts
git commit -m "feat: fetch and validate category landings and the home page entry"
```

---
### Task 4: Replace the category JSON config

**Files:**
- Modify: `src/utils/categoryTitle.ts`, `src/lib/navLinks.ts`, `src/components/Layout/TopNav.tsx`, `src/components/Home/CategoryPostSections.tsx`, `src/lib/homepageSchema.ts`
- Modify: `src/components/FilteredArchive/getCategoryStaticProps.ts`, `getAllStaticProps.ts`, `getTagStaticProps.ts`
- Modify: `src/pages/index.tsx`, `src/pages/category/[slug].tsx`, `src/pages/category/[slug]/page/[page].tsx`
- Modify tests: `src/__tests__/lib/navLinks.test.ts`, `src/__tests__/components/CategoryPostSections.test.tsx`, `src/__tests__/lib/homepageSchema.test.ts`
- Delete: `data/categories.json`, `src/types/categoryConfig.ts`, `src/utils/categoryConfig.ts`, `src/__tests__/utils/categoryConfig.test.ts`

**Interfaces:**
- Consumes: `CATEGORY_IDS`, `CategoryId`, `CATEGORY_TITLES`, `isCategoryId` from `@/constants`; `loadSiteContent`, `LandingMap`, `LandingContent`, `HomeContent` from `@/lib/siteContent` (Task 3).
- Produces: `buildNavLinks(): NavLink[]` (no argument); `CategoryPostSections({ posts })` (no `categoryConfig`); `buildHomepageSchema( posts: BlogPosts, landings: LandingMap, home: HomeContent )`; `getCategoryStaticProps` returns `{ posts, page, filter, seo, heading, landing }` where `landing: LandingContent | null` is set only on page 1; the home `getStaticProps` returns `{ posts, home, schema }`.

- [ ] **Step 1: Point the title helper at the constant.** Replace `src/utils/categoryTitle.ts`:

```ts
import { CATEGORY_TITLES, isCategoryId } from "@/constants";

export function categoryTitleFor( categoryId: string | undefined ): string {
  if( categoryId === undefined || !isCategoryId( categoryId ) ) {
    throw new Error( `categoryTitleFor: unknown category "${categoryId}"` );
  }
  return CATEGORY_TITLES[categoryId];
}
```

The existing `categoryTitle.test.ts` still passes unchanged.

- [ ] **Step 2: Nav links from the constant.** In `src/lib/navLinks.ts`, drop the `CategoryConfigMap` import and the argument:

```ts
import { AUTHOR_SLUG, CATEGORY_IDS, CATEGORY_TITLES } from "@/constants";

export function buildNavLinks(): NavLink[] {
  const categoryLinks = CATEGORY_IDS.map( categoryId => ({ href: `/category/${categoryId}`, label: CATEGORY_TITLES[categoryId] }) );
  return [ ...categoryLinks, { href: `/author/${AUTHOR_SLUG}`, label: ABOUT_LABEL } ];
}
```

In `TopNav.tsx`, remove the `categoriesData` and `CategoryConfigMap` imports and use `const NAV_LINKS = buildNavLinks();`. In `navLinks.test.ts`, call `buildNavLinks()` with no argument, delete the local `categoryConfig` fixture, and delete the "fails loudly when a category has no config" test (there is no config to be missing).

- [ ] **Step 3: Home sections read titles from the constant.** In `CategoryPostSections.tsx`, remove the `categoryConfig` prop and its import, and replace the config lookup and its throw with `const title = CATEGORY_TITLES[section.categoryId];`, using `title` where `config.title` was. In `CategoryPostSections.test.tsx`, remove the `categoryConfig` fixture and prop from every render, and delete the "throws if a post category is missing from categoryConfig" test.

- [ ] **Step 4: Schema reads landings and home content.** In `src/lib/homepageSchema.ts`:

```ts
import { BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { HomeContent, LandingMap } from "@/lib/siteContent";
import { CATEGORY_IDS, CATEGORY_TITLES, POSTS_PER_CATEGORY_SECTION, SITE_URL } from "@/constants";

export function buildHomepageSchema( posts: BlogPosts, landings: LandingMap, home: HomeContent ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": home.seoTitle,
    "description": home.seoDescription,
    "url": SITE_URL,
    "isPartOf": { "@type": "WebSite", "name": home.seoTitle, "url": SITE_URL },
    "hasPart": CATEGORY_IDS.map( categoryId => {
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return {
        "@type": "CollectionPage",
        "name": CATEGORY_TITLES[categoryId],
        "description": landings[categoryId].description,
        "url": `${SITE_URL}/category/${categoryId}`,
        "hasPart": categoryPosts.map( post => {
          const imageUrl = post.fields.image?.fields.file?.url;
          return {
            "@type": "BlogPosting",
            "headline": post.fields.title,
            "url": `${SITE_URL}/post/${post.fields.slug}`,
            "datePublished": resolvePostDate( post ),
            "image": imageUrl ? `https:${imageUrl}` : undefined,
          };
        }),
      };
    }),
  };
}
```

In `homepageSchema.test.ts`, replace the `categoryConfig` fixture with a `landings` fixture built from `LandingContent` objects (descriptions "Music posts", "Event posts", "Lifestyle posts"; every other field `null` or `[]`) and a `home` fixture (`seoTitle: "Audeos"`, `seoDescription: "Listen, tune in, or book a DJ set."`, `lines: []`, `showNowPlaying: false`, `hireLinkLabel: "DJ FOR HIRE →"`), and pass both to every `buildHomepageSchema` call. Update any assertion on the top-level `name` / `description` to the `home` fixture values.

- [ ] **Step 5: Static props load site content.** `getCategoryStaticProps.ts`:

```ts
import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { loadSiteContent } from "@/lib/siteContent";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { CATEGORY_TITLES, isCategoryId, META_IMAGE, SITE_URL } from "@/constants";

export async function getCategoryStaticProps( context: GetStaticPropsContext ) {
  const slugParam = context.params?.slug;
  if( typeof slugParam !== "string" || !isCategoryId( slugParam ) ) {
    throw new Error( `getCategoryStaticProps: unknown category slug "${String( slugParam )}"` );
  }
  const page: number = Number( context.params?.page ) || 1;
  const [ posts, { landings } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );
  const landing = landings[slugParam];
  const title = CATEGORY_TITLES[slugParam];

  const seo: ArchiveSeo = {
    title: page > 1 ? `${title} — Page ${page} | Audeos.com` : `${title} | Audeos.com`,
    description: landing.description,
    ogImage: landing.ogImageUrl ? `https:${landing.ogImageUrl}` : META_IMAGE,
    canonical: `${SITE_URL}/category/${slugParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "category", id: slugParam };

  return {
    props: { posts, page, filter, seo, heading: title, landing: page === 1 ? landing : null },
  };
}
```

In `getAllStaticProps.ts` and `getTagStaticProps.ts`, delete the `categoriesData`, `CategoryConfigMap` and `validateCategoryConfig` imports and the validation block, and add `await loadSiteContent();` right after `getBlogPosts()` so every archive page still fails the build on invalid content.

- [ ] **Step 6: Paths from `CATEGORY_IDS`.** `src/pages/category/[slug].tsx`:

```ts
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CATEGORY_IDS } from "@/constants";

export const getStaticProps = getCategoryStaticProps;

export async function getStaticPaths() {
  return {
    paths: CATEGORY_IDS.map( slug => ({ params: { slug } }) ),
    fallback: false,
  };
}

export default FilteredArchive;
```

In `src/pages/category/[slug]/page/[page].tsx`, drop the config imports and loop `for( const slug of CATEGORY_IDS )` (import `CATEGORY_IDS` alongside `PAGE_SIZE`).

- [ ] **Step 7: Home page loads site content.** In `src/pages/index.tsx`, remove the `categoriesData`, `CategoryConfigMap` and `validateCategoryConfig` imports, drop the `categoryConfig` prop from `CategoryPostSections`, and change `getStaticProps` and `HomeProps`:

```ts
export interface HomeProps {
  posts: BlogPosts;
  home: HomeContent;
  schema: ReturnType<typeof buildHomepageSchema>;
}

export async function getStaticProps() {
  const [ posts, { landings, home } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );
  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts, landings, home );
  return { props: { posts, home, schema } };
}
```

Use `home.seoTitle` and `home.seoDescription` for `SeoHead`'s `title` and `description` (keep `canonicalUrl={ SITE_URL }` and `ogImage={ META_IMAGE }`). Remove `META_TITLE` and `META_DESCRIPTION` from the import if nothing else in the file uses them.

- [ ] **Step 8: Delete the JSON config and its code:**

```bash
git rm data/categories.json src/types/categoryConfig.ts src/utils/categoryConfig.ts src/__tests__/utils/categoryConfig.test.ts
git grep -n -E "categories\.json|categoryConfig|CategoryConfigMap|validateCategoryConfig" -- src
```

Expected: the grep prints nothing.

- [ ] **Step 9: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test && make build`
Expected: PASS. `make build` fetches the Task 2 entries; a missing or invalid entry fails here with a named message.

```bash
git add -A src data
git commit -m "feat: read category and home content from Contentful; delete categories.json"
```

---
### Task 5: Home stack, live line and hire link

**Files:**
- Create: `src/components/Home/HomeIntro.tsx`, `src/components/Home/LiveLine.tsx`
- Modify: `src/pages/index.tsx` (render `HomeIntro`; remove `NowPlayingCard`)
- Modify: `src/styles/Home.module.scss` (stack, live line, hire link)
- Modify: `src/constants.ts` (`LIVE_LINE_PREFIX`)
- Test: `src/__tests__/components/HomeIntro.test.tsx`

**Interfaces:**
- Consumes: `HomeContent` (Task 3); `useNowPlaying` from `@/components/NowPlaying/nowPlayingStore`; `HIRE_PATH`, `STREAM_CHANNEL_URL` from `@/constants`.
- Produces: `export default function HomeIntro({ lines, showNowPlaying, hireLinkLabel }: Pick<HomeContent, "lines" | "showNowPlaying" | "hireLinkLabel"> )`; `export default function LiveLine()`; `export const LIVE_LINE_PREFIX = "Now playing on audeos.fm";`.

- [ ] **Step 1: Write the failing tests** at `src/__tests__/components/HomeIntro.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => <a href={ href } { ...props }>{ children }</a>,
}) );

import HomeIntro from "@/components/Home/HomeIntro";

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

describe( "HomeIntro", () => {
  it( "renders the stacked lines in order and links the hire label to Events", () => {
    render( <HomeIntro lines={ [ "MUSIC, EVENTS, LIFESTYLE", "SECOND LINE" ] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( screen.getAllByRole( "listitem" ).map( item => item.textContent ) ).toEqual( [ "MUSIC, EVENTS, LIFESTYLE", "SECOND LINE" ] );
    expect( screen.getByRole( "link", { name: "DJ FOR HIRE →" }).getAttribute( "href" ) ).toBe( "/category/events" );
  });

  it( "renders no empty stack when there are no lines", () => {
    const { container } = render( <HomeIntro lines={ [] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( container.querySelector( "ul" ) ).toBeNull();
    expect( screen.getByRole( "link", { name: "DJ FOR HIRE →" }) ).toBeInTheDocument();
  });

  it( "shows the current track when the live line is on", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => payload }) ) );
    render( <HomeIntro lines={ [] } showNowPlaying={ true } hireLinkLabel="DJ FOR HIRE →" /> );
    await waitFor( () => expect( screen.getByText( /Slappers — DJ Audeos/ ) ).toBeInTheDocument() );
  });

  it( "drops the live line quietly when audeos.fm is down", async () => {
    const failingFetch = vi.fn( async () => { throw new Error( "offline" ); });
    vi.stubGlobal( "fetch", failingFetch );
    render( <HomeIntro lines={ [ "MUSIC, EVENTS, LIFESTYLE" ] } showNowPlaying={ true } hireLinkLabel="DJ FOR HIRE →" /> );
    await waitFor( () => expect( failingFetch ).toHaveBeenCalled() );
    await act( async () => { await failingFetch.mock.results[0].value.catch( () => undefined ); });
    expect( screen.queryByText( /now playing on audeos\.fm/i ) ).toBeNull();
    expect( screen.getByText( "MUSIC, EVENTS, LIFESTYLE" ) ).toBeInTheDocument();
  });

  it( "never polls the stream when the live line is off", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal( "fetch", fetchSpy );
    render( <HomeIntro lines={ [] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( fetchSpy ).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/components/HomeIntro.test.tsx`
Expected: FAIL, cannot resolve `@/components/Home/HomeIntro`.

- [ ] **Step 3: Add the prefix constant** to `src/constants.ts`:

```ts
export const LIVE_LINE_PREFIX = "Now playing on audeos.fm";
```

- [ ] **Step 4: Implement `src/components/Home/LiveLine.tsx`**

```tsx
import { useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";
import { LIVE_LINE_PREFIX, STREAM_CHANNEL_URL } from "@/constants";
import styles from "@/styles/Home.module.scss";

// The corner widget already shows the stream, so this line simply disappears while there's no track.
export default function LiveLine() {
  const { data } = useNowPlaying();
  if( !data ) return null;
  const track = data.track.artist ? `${data.track.title} — ${data.track.artist}` : data.track.title;
  return (
    <p className={ styles.liveLine }>
      <a href={ STREAM_CHANNEL_URL }>{ LIVE_LINE_PREFIX }: { track }</a>
    </p>
  );
}
```

Check `src/components/NowPlaying/nowPlayingTypes.ts` for the exact `track` field names before writing; use them as typed.

- [ ] **Step 5: Implement `src/components/Home/HomeIntro.tsx`**

```tsx
import Link from "next/link";
import LiveLine from "@/components/Home/LiveLine";
import { HomeContent } from "@/lib/siteContent";
import { HIRE_PATH } from "@/constants";
import styles from "@/styles/Home.module.scss";

export type HomeIntroProps = Pick<HomeContent, "lines" | "showNowPlaying" | "hireLinkLabel">;

export default function HomeIntro({ lines, showNowPlaying, hireLinkLabel }: HomeIntroProps ) {
  return (
    <div className={ styles.homeIntro }>
      { lines.length > 0 && (
        <ul className={ styles.homeLines }>
          { lines.map( ( line, lineIndex ) => <li key={ `${lineIndex}-${line}` }>{ line }</li> ) }
        </ul>
      ) }
      { showNowPlaying && <LiveLine /> }
      <Link href={ HIRE_PATH } className={ styles.hireLink }>{ hireLinkLabel }</Link>
    </div>
  );
}
```

- [ ] **Step 6: Styles** in `src/styles/Home.module.scss`, after `.main`:

```scss
.homeIntro {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  padding: 1.5rem 0.75rem 2.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media (min-width: 800px) {
    padding-inline: 2rem;
  }
}

.homeLines {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--ink);
}

.liveLine a {
  color: var(--mute);
  text-decoration: none;

  &:hover {
    color: var(--accent);
  }
}

.hireLink {
  align-self: flex-start;
  color: var(--accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
```

- [ ] **Step 7: Render it on the home page.** In `src/pages/index.tsx`, replace `<NowPlayingCard />` with:

```tsx
<HomeIntro lines={ home.lines } showNowPlaying={ home.showNowPlaying } hireLinkLabel={ home.hireLinkLabel } />
```

and remove the `NowPlayingCard` import. Destructure `home` from the props.

- [ ] **Step 8: Run the tests**

Run: `pnpm vitest run src/__tests__/components/HomeIntro.test.tsx`
Expected: PASS.

- [ ] **Step 9: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: PASS.

```bash
git add src/components/Home src/pages/index.tsx src/styles/Home.module.scss src/constants.ts src/__tests__/components/HomeIntro.test.tsx
git commit -m "feat: home page stacked lines, optional live line and hire link from Contentful"
```

---
### Task 6: Events price lists, rental section, footnote and booking link

**Files:**
- Create: `src/components/Landing/PriceList.tsx`, `src/components/Landing/EventsLanding.tsx`, `src/components/Landing/CategoryLanding.tsx`
- Create: `src/styles/Landing.module.scss`
- Modify: `src/components/FilteredArchive/FilteredArchive.tsx` (render the landing on page 1)
- Modify: `src/constants.ts` (`GEAR_ONLY_LABEL`, `WITH_ME_LABEL`)
- Test: `src/__tests__/components/PriceList.test.tsx`, `src/__tests__/components/CategoryLanding.test.tsx`

**Interfaces:**
- Consumes: `LandingContent`, `PricePackage` (Task 3); `formatPrice` (Task 3); `Markdown` from `@/components/Markdown`.
- Produces: `PriceList({ packages, showOperatedPrice }: { packages: PricePackage[]; showOperatedPrice: boolean })`; `EventsLanding({ landing }: { landing: LandingContent })`; `CategoryLanding({ landing }: { landing: LandingContent })`, which Task 7 extends with the Music branch; `FilteredArchiveProps.landing?: LandingContent | null`.

- [ ] **Step 1: Write the failing tests.** `src/__tests__/components/PriceList.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PriceList from "@/components/Landing/PriceList";
import { PricePackage } from "@/lib/siteContent";

const pair: PricePackage = {
  id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [ "2× K12, stands", "2 Shure SM58" ],
};
const party: PricePackage = {
  id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: null, priceUnit: "per event", includes: [ "Up to 4 hrs" ],
};

describe( "PriceList", () => {
  it( "shows the Gear only and With me prices on a rental row", () => {
    render( <PriceList packages={ [ pair ] } showOperatedPrice /> );
    const row = screen.getByRole( "listitem" );
    expect( within( row ).getByText( "Gear only" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "$250" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "With me" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "$600" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "2 Shure SM58" ) ).toBeInTheDocument();
  });

  it( "shows one price and its unit on a DJ row", () => {
    render( <PriceList packages={ [ party ] } showOperatedPrice={ false } /> );
    const row = screen.getByRole( "listitem" );
    expect( within( row ).getByText( "$1,200" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "per event" ) ).toBeInTheDocument();
    expect( within( row ).queryByText( "With me" ) ).toBeNull();
  });
});
```

`src/__tests__/components/CategoryLanding.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock( "@/components/Markdown", () => ({
  Markdown: ({ children }: { children?: string }) => <p>{ children }</p>,
}) );

import CategoryLanding from "@/components/Landing/CategoryLanding";
import { LandingContent, PricePackage } from "@/lib/siteContent";

const party: PricePackage = { id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: null, priceUnit: "per event", includes: [] };
const pair: PricePackage = { id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [] };

function landing( overrides: Partial<LandingContent> ): LandingContent {
  return { category: "events", description: "", intro: null, body: null, packages: [], rentalHeading: null, footnote: null, ctaLabel: null, ctaUrl: null, ogImageUrl: null, ...overrides };
}

describe( "CategoryLanding", () => {
  it( "renders nothing for a landing with no intro or packages", () => {
    const { container } = render( <CategoryLanding landing={ landing({ category: "lifestyle" }) } /> );
    expect( container ).toBeEmptyDOMElement();
  });

  it( "renders the Events intro, both price lists, footnote and booking link", () => {
    render( <CategoryLanding landing={ landing({
      intro: "Seattle-based DJ for parties, nightlife and private events.",
      packages: [ party, pair ],
      rentalHeading: "Speaker rental",
      footnote: "Travel is quoted per event.",
      ctaLabel: "Book a call →",
      ctaUrl: "https://cal.com/audeos/inquiry",
    }) } /> );
    expect( screen.getByText( "Seattle-based DJ for parties, nightlife and private events." ) ).toBeInTheDocument();
    expect( screen.getByText( "Party / club night" ) ).toBeInTheDocument();
    expect( screen.getByRole( "heading", { name: "Speaker rental" }) ).toBeInTheDocument();
    expect( screen.getByText( "Pair" ) ).toBeInTheDocument();
    expect( screen.getByText( "Travel is quoted per event." ) ).toBeInTheDocument();
    expect( screen.getByRole( "link", { name: "Book a call →" }).getAttribute( "href" ) ).toBe( "https://cal.com/audeos/inquiry" );
  });

  it( "leaves out the rental section when there are no rental packages", () => {
    render( <CategoryLanding landing={ landing({ packages: [ party ], rentalHeading: "Speaker rental" }) } /> );
    expect( screen.queryByRole( "heading", { name: "Speaker rental" }) ).toBeNull();
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm vitest run src/__tests__/components/PriceList.test.tsx src/__tests__/components/CategoryLanding.test.tsx`
Expected: FAIL, cannot resolve the new components.

- [ ] **Step 3: Add the column labels** to `src/constants.ts`:

```ts
export const GEAR_ONLY_LABEL = "Gear only";
export const WITH_ME_LABEL = "With me";
```

- [ ] **Step 4: Implement `src/components/Landing/PriceList.tsx`**

```tsx
import { PricePackage } from "@/lib/siteContent";
import { formatPrice } from "@/utils/formatPrice";
import { GEAR_ONLY_LABEL, WITH_ME_LABEL } from "@/constants";
import styles from "@/styles/Landing.module.scss";

export interface PriceListProps {
  packages: PricePackage[];
  showOperatedPrice: boolean;
}

export default function PriceList({ packages, showOperatedPrice }: PriceListProps ) {
  return (
    <ul className={ styles.priceList }>
      { packages.map( pricePackage => (
        <li key={ pricePackage.id } className={ styles.priceRow }>
          <div className={ styles.priceName }>
            <h3>{ pricePackage.name }</h3>
            { pricePackage.includes.length > 0 && (
              <ul className={ styles.includes }>
                { pricePackage.includes.map( item => <li key={ item }>{ item }</li> ) }
              </ul>
            ) }
          </div>
          <dl className={ styles.prices }>
            <div>
              { showOperatedPrice && <dt>{ GEAR_ONLY_LABEL }</dt> }
              <dd className={ styles.price }>{ formatPrice( pricePackage.price ) }</dd>
            </div>
            { showOperatedPrice && pricePackage.priceOperated !== null && (
              <div>
                <dt>{ WITH_ME_LABEL }</dt>
                <dd className={ styles.price }>{ formatPrice( pricePackage.priceOperated ) }</dd>
              </div>
            ) }
            <div className={ styles.unit }>{ pricePackage.priceUnit }</div>
          </dl>
        </li>
      ) ) }
    </ul>
  );
}
```

- [ ] **Step 5: Implement `src/components/Landing/EventsLanding.tsx`**

```tsx
import { Markdown } from "@/components/Markdown";
import PriceList from "@/components/Landing/PriceList";
import { LandingContent } from "@/lib/siteContent";
import styles from "@/styles/Landing.module.scss";

export default function EventsLanding({ landing }: { landing: LandingContent }) {
  const djPackages = landing.packages.filter( pricePackage => pricePackage.group === "dj" );
  const rentalPackages = landing.packages.filter( pricePackage => pricePackage.group === "speakerRental" );
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      { djPackages.length > 0 && <PriceList packages={ djPackages } showOperatedPrice={ false } /> }
      { rentalPackages.length > 0 && (
        <section className={ styles.rental }>
          { landing.rentalHeading && <h2 className={ styles.rentalHeading }>{ landing.rentalHeading }</h2> }
          <PriceList packages={ rentalPackages } showOperatedPrice />
        </section>
      ) }
      { landing.footnote && <p className={ styles.footnote }>{ landing.footnote }</p> }
      { landing.ctaLabel && landing.ctaUrl && (
        <a href={ landing.ctaUrl } className={ styles.cta }>{ landing.ctaLabel }</a>
      ) }
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
```

- [ ] **Step 6: Implement `src/components/Landing/CategoryLanding.tsx`.** Categories without their own layout (Lifestyle today) show only an intro and body when the entry has them:

```tsx
import { Markdown } from "@/components/Markdown";
import EventsLanding from "@/components/Landing/EventsLanding";
import { LandingContent } from "@/lib/siteContent";
import styles from "@/styles/Landing.module.scss";

export default function CategoryLanding({ landing }: { landing: LandingContent }) {
  if( landing.category === "events" ) return <EventsLanding landing={ landing } />;
  if( !landing.intro && !landing.body ) return null;
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
```

`EventsLanding` returns its section even with no content; the "renders nothing" test uses Lifestyle. If the Events entry ever has no intro, packages, CTA or body, the empty section is acceptable (the build has already validated the entry).

- [ ] **Step 7: Styles** at `src/styles/Landing.module.scss`:

```scss
.landing {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  padding: 1.5rem 0.75rem 3rem;
  border-bottom: 1px solid var(--rule);

  @media (min-width: 800px) {
    padding-inline: 2rem;
  }
}

.intro,
.body {
  max-width: 44rem;
  font-size: 1.15rem;
  line-height: 1.5;
}

.priceList {
  list-style: none;
  border-top: 1px solid var(--rule);
}

.priceRow {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1.5rem;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--rule);

  @media (max-width: 699px) {
    flex-direction: column;
    gap: 0.75rem;
  }
}

.priceName h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

.includes {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  margin-top: 0.4rem;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--mute);
}

.prices {
  display: flex;
  align-items: baseline;
  gap: 1.5rem;
  flex-shrink: 0;

  dt {
    font-family: var(--font-mono);
    font-size: 0.7rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--mute);
  }
}

.price {
  font-size: 1.75rem;
  font-weight: 800;
}

.unit {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--mute);
}

.rental {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .priceName h3 {
    font-size: 1.05rem;
  }

  .price {
    font-size: 1.35rem;
  }
}

.rentalHeading {
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mute);
}

.footnote {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--mute);
}

.cta {
  align-self: flex-start;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
```

- [ ] **Step 8: Render it in the archive.** In `FilteredArchive.tsx`, add `landing?: LandingContent | null` to `FilteredArchiveProps`, destructure it, import `CategoryLanding`, and render it right after the giant word:

```tsx
{ heading && <GiantWord text={ heading } /> }
{ landing && <CategoryLanding landing={ landing } /> }
```

- [ ] **Step 9: Run the tests**

Run: `pnpm vitest run src/__tests__/components/PriceList.test.tsx src/__tests__/components/CategoryLanding.test.tsx`
Expected: PASS.

- [ ] **Step 10: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: PASS.

```bash
git add src/components/Landing src/components/FilteredArchive/FilteredArchive.tsx src/styles/Landing.module.scss src/constants.ts src/__tests__/components/PriceList.test.tsx src/__tests__/components/CategoryLanding.test.tsx
git commit -m "feat: Events price lists, speaker rental section, footnote and booking link"
```

---

### Task 7: Music player block and listening row

**Files:**
- Create: `src/components/Landing/MusicLanding.tsx`
- Modify: `src/components/Landing/CategoryLanding.tsx` (Music branch)
- Modify: `src/lib/socialLinks.ts` (`name` per link, `LISTENING_LINKS`)
- Modify: `src/components/NowPlaying/NowPlayingCard.module.scss` (dark tokens; no gradients or purple)
- Modify: `src/styles/Landing.module.scss` (listening row)
- Test: `src/__tests__/components/CategoryLanding.test.tsx` (add the Music case)

**Interfaces:**
- Consumes: `NowPlayingCard` (unchanged behavior), `SOCIAL_LINKS`, `LandingContent`.
- Produces: `SocialLink.name: string`; `export const LISTENING_LINKS: SocialLink[]` (SoundCloud, Mixcloud, Bandcamp, Spotify, YouTube, Dropbox, in that order); `MusicLanding({ landing }: { landing: LandingContent })`.

- [ ] **Step 1: Add the failing test** to `src/__tests__/components/CategoryLanding.test.tsx` (mock the card; it has its own tests):

```tsx
vi.mock( "@/components/NowPlaying/NowPlayingCard", () => ({
  default: () => <div data-testid="now-playing-card" />,
}) );
```

(place it with the other `vi.mock` calls, before the import of `CategoryLanding`), and:

```tsx
  it( "renders the Music intro, the audeos.fm player and every listening link", () => {
    render( <CategoryLanding landing={ landing({
      category: "music",
      intro: "Original music, DJ mixes, edits and playlists. Tune in to the live stream on audeos.fm.",
    }) } /> );
    expect( screen.getByTestId( "now-playing-card" ) ).toBeInTheDocument();
    expect( screen.getAllByRole( "link" ).map( link => link.textContent ) )
      .toEqual( [ "SoundCloud", "Mixcloud", "Bandcamp", "Spotify", "YouTube", "Dropbox" ] );
    expect( screen.queryByRole( "heading", { name: "Speaker rental" }) ).toBeNull();
  });
```

- [ ] **Step 2: Run it to see it fail**

Run: `pnpm vitest run src/__tests__/components/CategoryLanding.test.tsx`
Expected: FAIL (the Music landing renders only its intro).

- [ ] **Step 3: Name every social link and export the listening row.** In `src/lib/socialLinks.ts`, add `name: string;` to `SocialLink` and a `name` to each entry: Instagram, SoundCloud, TikTok, Spotify, YouTube, Dropbox, Mixcloud, Bandcamp, X, Facebook, GitHub, Signal. Then:

```ts
const LISTENING_ORDER = [ "SoundCloud", "Mixcloud", "Bandcamp", "Spotify", "YouTube", "Dropbox" ];

export const LISTENING_LINKS: SocialLink[] = LISTENING_ORDER.map( name => {
  const link = SOCIAL_LINKS.find( socialLink => socialLink.name === name );
  if( !link ) throw new Error( `LISTENING_LINKS: no social link named "${name}"` );
  return link;
});
```

- [ ] **Step 4: Implement `src/components/Landing/MusicLanding.tsx`**

```tsx
import { Markdown } from "@/components/Markdown";
import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";
import { LandingContent } from "@/lib/siteContent";
import { LISTENING_LINKS } from "@/lib/socialLinks";
import styles from "@/styles/Landing.module.scss";

export default function MusicLanding({ landing }: { landing: LandingContent }) {
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      <NowPlayingCard />
      <ul className={ styles.listening }>
        { LISTENING_LINKS.map( link => (
          <li key={ link.href }>
            <a href={ link.href } title={ link.title }>{ link.name }</a>
          </li>
        ) ) }
      </ul>
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
```

In `CategoryLanding.tsx`, import it and add `if( landing.category === "music" ) return <MusicLanding landing={ landing } />;` after the Events line.

- [ ] **Step 5: Listening row styles** in `src/styles/Landing.module.scss`:

```scss
.listening {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  font-family: var(--font-mono);
  font-size: 0.8rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;

  a {
    color: var(--ink);
    text-decoration: none;

    &:hover {
      color: var(--accent);
    }
  }
}
```

- [ ] **Step 6: Restyle the player to the dark system.** In `NowPlayingCard.module.scss`, replace every gradient, purple and blue value with tokens: the card background becomes `var(--paper)` with a `1px solid var(--rule)` border; labels, the eq bars and the progress fill use `var(--accent)`; secondary text uses `var(--mute)`; the offline state uses `var(--mute)`. Keep layout, sizes and animations. Confirm with `grep -n -i -E "gradient|#[0-9a-f]{3,6}|rgba\\(" src/components/NowPlaying/NowPlayingCard.module.scss` that no hard-coded colors or gradients remain.

- [ ] **Step 7: Run the tests**

Run: `pnpm vitest run src/__tests__/components/CategoryLanding.test.tsx src/__tests__/components/NowPlayingCard.test.tsx`
Expected: PASS.

- [ ] **Step 8: Verify and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: PASS.

```bash
git add src/components/Landing src/lib/socialLinks.ts src/components/NowPlaying/NowPlayingCard.module.scss src/styles/Landing.module.scss src/__tests__/components/CategoryLanding.test.tsx
git commit -m "feat: Music landing with the audeos.fm player and listening links"
```

---

### Task 8: Docs, full verification and pull request

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `CLAUDE.md`.**
  - Data flow: replace the "Editorial SEO copy lives on categories… `data/categories.json`" bullet with: category search descriptions, intros, packages, booking links and footnotes live in Contentful `categoryLanding` entries (one per category, validated at build by `src/lib/siteContent.ts`); the home page's lines, live-line switch, hire label, title and meta description live in the single `homePage` entry; category titles stay the `CATEGORY_TITLES` constant because client-rendered UI needs them. Keep the note that tag pages render generic SEO by design.
  - Data flow: add `getCategoryLandings()` and `getHomePages()` to the list of `contentfulUtils` helpers and `loadSiteContent()` as the one validated load per build.
  - Commands: add `make content-migration FILE=…` with a one-line description, and note that content model changes go through migration files in `contentful/migrations/` (shown to the owner first), followed by `make types`.
  - Invariants: add "**Content validation fails the build** — `buildLandingMap` / `buildHomeContent` throw with the category or package named; never add a fallback that renders a page without its content."
  - Routing: the `/` row's description mentions the home stack and hire link.

- [ ] **Step 2: Full verification**

Run: `pnpm format && pnpm lint && pnpm test && make build`
Expected: PASS; the build output includes `/category/events` with the price lists and `/category/music` with the listening row.

Run: `git grep -n -E "categories\\.json|categoryConfig|CategoryConfigMap" -- src docs/superpowers/specs`
Expected: no matches in `src` (the spec may still mention the history).

- [ ] **Step 3: Owner checks in the running dev server** (do not start one):
  1. `/`: giant AUDEOS, the stacked line, "DJ FOR HIRE →" linking to Events; with `showNowPlaying` flipped on in Contentful, the live line appears.
  2. `/category/events`: intro, DJ price list, smaller "Speaker rental" list with Gear only / With me, the travel footnote, "Book a call →".
  3. `/category/music`: intro, restyled audeos.fm player (no purple), six listening links.
  4. `/category/lifestyle`: giant word and archive only.
  5. Page 2 of Events and Music: no evergreen layer.
  6. Phone width: price rows stack, nothing scrolls sideways.

- [ ] **Step 4: Commit, push and open the PR**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md notes for Contentful-backed category and home content"
git push -u origin feat/hub-content-models
gh pr create --base main --title "feat: hub redesign content models with home and category pages" --body "Implements PR 2 of docs/superpowers/specs/2026-10-11-audeos-hub-redesign-design.md: Contentful content model and entries for category landings, service packages and the home page; home stack, live line and SEO; Events price lists, rental section, footnote and booking link; Music player and listening links; categories.json removed."
```
