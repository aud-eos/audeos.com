# Hub redesign PR 3: About page, brands and identity structured data — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/author/audeos` into the About page (giant ABOUT, artist block, ventures list, Resume and GitHub links), and give search engines one consistent identity: Audeos the artist, AUDEOS, LLC with its brands, and Northwest Local Cannabis as its own company. Home and Events carry the same identity records, and Events gains priced services with service areas.

**Architecture:** The author entry and its linked brands load once per build through `loadSiteContent()`, mapped by a new `aboutContent` module into a validated plain view model. A new `src/lib/structuredData/` folder holds pure builders: `identity.ts` (Person, Organization, separate-company Organizations, and a `withIdentity` wrapper that emits one `@graph`) and `eventsServices.ts` (DJ and speaker-rental `Service` records with `Offer`s). Pages put the builders' output into the existing `JsonLd` component. Google does not resolve `@id` across pages, so every page that mentions the Organization carries the full identity graph from the same builder.

**Tech Stack:** Next.js 16 pages router with static export, React 19, TypeScript, SCSS modules, Vitest with Testing Library, Contentful CDA (`contentful` 11), the Contentful MCP for model and entry writes, pnpm via mise, Node 25.

**Spec:** `docs/superpowers/specs/2026-10-11-audeos-hub-redesign-design.md` (revised for PR 3 in #167). This plan covers the spec's Delivery item 3 only. The ben-petty.com PR is separate and not in this plan.

## Global Constraints

- **Two layers.** Visible copy speaks as the entity: no keyword lines such as "SEATTLE WEDDING DJ"; DJ work is one service Audeos offers. The search layer (structured data, `<title>`, meta descriptions) gives search engines as much as possible: Seattle home base, every service with prices and service areas, every name and brand. City lists appear only in structured data, never as visible copy.
- **Audeos is a person and an entity.** The artist and AUDEOS, LLC appear together; copy is presence, not a resume or elevator pitch.
- **Copy:** every visible line on the About page, the ventures heading, the brand fields, `META_DESCRIPTION` and the `SOCIAL_LINKS` titles come from the Task 1 copy pass with the owner. Never invent copy beyond what Task 1 records; the stand-ins in this plan's code (such as `VENTURES_HEADING = "Ventures"`) are replaced by Task 1's approved values.
- **Contentful writes:** every proposed content type change and entry value is shown to the owner for approval before any MCP write tool runs. Only the controller session writes to Contentful, never a subagent. `update_content_type` replaces the whole fields array: resend every existing field.
- **Brands:** ventures rows in this order: audeos.fm; The North West Clothing (history line "BEGAN AS CRISIS CLOTHING", url on nwclothing.com); Northwest Local Cannabis (url on nw-local.com, `separateCompany` on). Every row looks the same; `separateCompany` affects structured data only. No DJ Audeos row, no Rooted Community.
- **Identity values (verbatim):** Person name "Audeos", `alternateName` "Benjamin S. Petty", "Ben Petty", "Benny Petty"; Organization name "Audeos", `legalName` "AUDEOS, LLC"; home base Seattle, WA, US; DJ services `areaServed` Seattle, Washington, United States; speaker rental `areaServed` Seattle, Tacoma, Everett; offers in USD; Person `@id` `https://www.audeos.com/#person`, Organization `@id` `https://www.audeos.com/#organization`.
- **Dark mode only.** Use only the existing tokens: `--ink`, `--paper`, `--mute`, `--rule`, `--accent`, `--hatch`, `--font-mona-sans`, `--font-mono`. No gradients.
- **No disclosure UI** (accordions, details/summary, collapsing sections).
- **TypeScript:** no `as` assertions (`as const` on literals is fine; use guards or `satisfies`), no single-character identifiers, no `eslint-disable`.
- **Fail loudly:** missing or invalid content throws at build time with a message naming the entry. No silent fallbacks.
- **Tests:** only behavior nothing else covers, through public interfaces, mocking only network, clock and randomness. Expected values come from the spec, not from the code under test. Delete tests the change makes redundant.
- **Checks before the PR:** `pnpm format`, `pnpm lint`, `pnpm test`, `make build`. The worktree needs the owner to link `.env` for `make types` and `make build`; ask, never read or copy it.
- **No dev server.** Visual checks happen in the owner's running server.

## Review Focus

1. **The author has no photo, or a brand has no logo, blurb, kind or history.** No `https:undefined` URLs in structured data and no empty paragraphs on the page; the record or row simply omits that field. Tests owned by Task 3 (structured data) and Task 5 (rows).
2. **A brand URL entered as `nwclothing.com`, `http://…` or `/category/events`.** The build must fail naming the brand, not ship a relative or insecure link into `sameAs`, `brand.url` or the ventures row. Test owned by Task 2.
3. **The audeos author entry is missing or has no brands linked (or every linked brand is unpublished).** The build must fail with a message naming the author, not render an About page without ventures or an Organization without brands. Test owned by Task 2.
4. **Events page 2 and later, and the Music and Lifestyle pages.** They must not carry the Events services; only Events page 1 does. Test owned by Task 4.
5. **A speaker-rental package must produce two offers (gear only and with the owner), a DJ package exactly one,** each in USD with its unit, and a landing with no rental packages emits no rental service. Test owned by Task 4.

---

## File structure

| File | Status | Responsibility |
|---|---|---|
| `src/types/contentful/TypeBrand.ts` | regenerated (Task 1) | Brand fields incl. `history`, `separateCompany`, required `url` |
| `src/constants.ts` | modify (Tasks 1, 3) | Copy constants from Task 1; identity constants |
| `src/lib/socialLinks.ts` | modify (Tasks 1, 3) | Approved tooltips; `isContact` on Signal; `socialLinkNamed` helper and `GITHUB_LINK` |
| `src/utils/contentfulUtils.ts` | modify (Task 2) | `getAuthors()` resolves brand logos (`include: 2`) |
| `src/lib/aboutContent.ts` | create (Task 2) | Author and brand view models, URL validation, identity-author lookup |
| `src/lib/siteContent.ts` | modify (Task 2) | `loadSiteContent()` also returns `about` |
| `src/lib/structuredData/identity.ts` | create (Task 3) | Person, Organization, separate-company records, `withIdentity`, profile-page schemas |
| `src/lib/homepageSchema.ts` | modify (Task 3) | CollectionPage names the Organization as publisher; no own `@context` |
| `src/pages/index.tsx` | modify (Task 3) | Home JSON-LD wrapped with the identity graph |
| `src/lib/structuredData/eventsServices.ts` | create (Task 4) | DJ and speaker-rental `Service` + `Offer` records |
| `src/components/FilteredArchive/getCategoryStaticProps.ts` | modify (Task 4) | Events page 1 gets the services schema |
| `src/components/FilteredArchive/FilteredArchive.tsx` | modify (Task 4) | Renders an optional `schema` prop |
| `src/components/About/About.tsx` | create (Task 5) | Artist block, ventures list, links row |
| `src/styles/About.module.scss` | create (Task 5) | About styles |
| `src/pages/author/[slug].tsx` | modify (Task 5) | Giant ABOUT, About component, profile JSON-LD |
| `src/styles/Author.module.scss` | delete (Task 5) | Replaced by About styles |
| `CLAUDE.md` | modify (Task 5) | Data flow, routing row, components, structured data notes |
| Tests | create/modify | `src/__tests__/lib/aboutContent.test.ts`, `src/__tests__/lib/identity.test.ts`, `src/__tests__/lib/eventsServices.test.ts`, `src/__tests__/components/About.test.tsx`, `src/__tests__/lib/homepageSchema.test.ts` |

---

### Task 1: Copy pass, brand model change and entries (controller only, owner-gated)

This task is run by the controller session, not a subagent: it needs the owner's approval and Contentful writes.

**Files:**
- Modify (Contentful): content type `brand`; new `brand` entries; author entry `3UiOelIV233YDeKGYplmIN`
- Regenerate: `src/types/contentful/TypeBrand.ts` (and `index.ts` if the generator touches it)
- Modify: `src/constants.ts`, `src/lib/socialLinks.ts`

**Interfaces:**
- Produces: `TypeBrandFields` with `url: EntryFieldTypes.Symbol` (required), `history?: EntryFieldTypes.Symbol`, `separateCompany?: EntryFieldTypes.Boolean`. Constants `VENTURES_HEADING` and `RESUME_LABEL` in `src/constants.ts`. Approved `META_DESCRIPTION` value and `SOCIAL_LINKS` `title` values.

- [ ] **Step 1: Run the copy pass with the owner.** Draft options (check every line against the "Audeos brand positioning" and "Phrases to avoid" memories and the spec's Two layers decision) and get the owner's explicit pick for each:
  - the author `bio` (markdown; presence, artist and ventures together, not a resume)
  - `VENTURES_HEADING` (stand-in "Ventures") and `RESUME_LABEL` (stand-in "Resume")
  - each brand's `kind` (short monospace label, such as "RADIO"), `blurb` (one line) and `url` (full https), plus The North West Clothing's `history` "BEGAN AS CRISIS CLOTHING" (confirm wording and whether to add years)
  - the author `resumeUrl` (expected `https://ben-petty.com/`)
  - `META_DESCRIPTION` (replaces "Official website of DJ Audeos"; search layer, so it may name services and Seattle)
  - every `SOCIAL_LINKS` `title` (tooltips; naming the owner is fine)
  - whether any brand has a logo file to upload (`make upload-images DIR=…`); logos are optional

- [ ] **Step 2: Show the brand model change for approval, then write it.** Proposed `brand` fields (all existing fields resent):

| id | name | type | required | notes |
|---|---|---|---|---|
| `name` | Name | Symbol | yes | unchanged |
| `kind` | Kind | Symbol | no | unchanged |
| `blurb` | Blurb | Text | no | unchanged |
| `url` | URL | Symbol | **yes** | was optional |
| `logo` | Logo | Link (Asset) | no | unchanged |
| `history` | History | Symbol | no | new |
| `separateCompany` | Separate company | Boolean | no | new; help text "On for a brand run by a company other than AUDEOS, LLC. Affects structured data only." |

Also update the content type description to "A brand shown on the About page". After approval: `mcp__contentful__update_content_type` (space `pvyz1kbxgmyk`, environment `master`) with the full field list, then `mcp__contentful__publish_content_type`.

- [ ] **Step 3: Show the entries for approval, then write them.** Three `brand` entries with the approved values, in this order: audeos.fm; The North West Clothing (`history` set); Northwest Local Cannabis (`separateCompany: true`). Then the author entry `3UiOelIV233YDeKGYplmIN`: `bio`, `resumeUrl`, and `brands` linking the three entries in that order, keeping its existing `name`, `image`, `email` and `slug`. Create and publish the brands first, then update and publish the author. Publish one at a time and expect a burst of repository_dispatch deploys; main does not read these fields yet except the old author page's bio, which is harmless.

- [ ] **Step 4: Regenerate types.** Ask the owner to link `.env` into the worktree (`! ln -s /Users/benny/dev/audeos.com/.env <worktree>/.env`) if not linked, then run `make types`. Expected: `TypeBrand.ts` gains `history` and `separateCompany`, and `url` loses its `?`. Confirm `contentful/export.json` is not staged.

- [ ] **Step 5: Apply the approved copy constants.** In `src/constants.ts` replace the `META_DESCRIPTION` value and add, after `DJ_PACKAGES_HEADING`:

```ts
export const VENTURES_HEADING = "Ventures"; // replace with the Task 1 approved heading
export const RESUME_LABEL = "Resume"; // replace with the Task 1 approved label
```

(write the approved strings, without the comments). In `src/lib/socialLinks.ts` replace each `title` with its approved value.

- [ ] **Step 6: Check and commit.**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: all pass (no code reads the new fields yet).

```bash
git add src/types/contentful src/constants.ts src/lib/socialLinks.ts
git commit -m "feat: brand history and separate-company fields, approved About copy constants"
```

---

### Task 2: About content view model and validation

**Files:**
- Create: `src/lib/aboutContent.ts`
- Modify: `src/lib/siteContent.ts`, `src/utils/contentfulUtils.ts:68-76`
- Test: `src/__tests__/lib/aboutContent.test.ts`

**Interfaces:**
- Consumes: `Author` type from `@/utils/contentfulUtils`; regenerated `TypeBrandFields` (Task 1); `AUTHOR_SLUG` from `@/constants`.
- Produces:
  - `interface BrandContent { id: string; name: string; kind: string | null; blurb: string | null; history: string | null; url: string; logoUrl: string | null; separateCompany: boolean }` (`logoUrl` is a full `https:` URL)
  - `interface AboutContent { name: string; slug: string; bio: string; imageUrl: string | null; resumeUrl: string | null; brands: BrandContent[] }` (`imageUrl` is a full `https:` URL without query string)
  - `interface BrandInput`, `interface AboutInput` (plain inputs, below)
  - `buildAboutContent( input: AboutInput ): AboutContent`
  - `buildIdentityAbout( authors: AboutInput[] ): AboutContent`
  - `toAboutInput( author: Author ): AboutInput`
  - `interface SiteContent { landings: LandingMap; home: HomeContent; about: AboutContent }` and `loadSiteContent(): Promise<SiteContent>` in `siteContent.ts`

- [ ] **Step 1: Write the failing tests**

`src/__tests__/lib/aboutContent.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock( "@/utils/contentfulUtils", () => ({}) );

import { AboutInput, BrandInput, buildAboutContent, buildIdentityAbout } from "@/lib/aboutContent";

const clothing: BrandInput = {
  id: "brand-clothing", name: "The North West Clothing", kind: "CLOTHING", blurb: undefined, history: "BEGAN AS CRISIS CLOTHING",
  url: "https://nwclothing.com/", logoUrl: undefined, separateCompany: undefined,
};

function author( overrides: Partial<AboutInput> = {}): AboutInput {
  return { name: "Audeos", slug: "audeos", bio: undefined, imageUrl: undefined, resumeUrl: undefined, brands: [ clothing ], ...overrides };
}

describe( "buildAboutContent", () => {
  it.each( [ "nwclothing.com", "http://nwclothing.com/", "/category/events" ] )( "fails on a brand URL that is not a full https address: %s", url => {
    expect( () => buildAboutContent( author({ brands: [ { ...clothing, url } ] }) ) )
      .toThrow( `Brand "The North West Clothing" url is not a full https address: "${url}"` );
  });

  it( "fails on a resume URL that is not a full https address", () => {
    expect( () => buildAboutContent( author({ resumeUrl: "ben-petty.com" }) ) )
      .toThrow( `Author "audeos" resumeUrl is not a full https address: "ben-petty.com"` );
  });
});

describe( "buildIdentityAbout", () => {
  it( "fails when no author has the site's author slug", () => {
    expect( () => buildIdentityAbout( [ author({ slug: "someone-else" }) ] ) )
      .toThrow( `No author entry with slug "audeos" in Contentful` );
  });

  it( "fails when the site's author has no brands", () => {
    expect( () => buildIdentityAbout( [ author({ brands: [] }) ] ) )
      .toThrow( `Author "audeos" has no brands; link at least one published brand entry` );
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/__tests__/lib/aboutContent.test.ts`
Expected: FAIL, cannot resolve `@/lib/aboutContent`.

- [ ] **Step 3: Implement `src/lib/aboutContent.ts`**

```ts
import { AUTHOR_SLUG } from "@/constants";
import type { Author } from "@/utils/contentfulUtils";

export interface BrandContent {
  id: string;
  name: string;
  kind: string | null;
  blurb: string | null;
  history: string | null;
  url: string;
  logoUrl: string | null;
  separateCompany: boolean;
}

export interface AboutContent {
  name: string;
  slug: string;
  bio: string;
  imageUrl: string | null;
  resumeUrl: string | null;
  brands: BrandContent[];
}

// Plain inputs, so validation is testable without Contentful entry shapes.
export interface BrandInput {
  id: string;
  name: string;
  kind: string | undefined;
  blurb: string | undefined;
  history: string | undefined;
  url: string;
  logoUrl: string | undefined;
  separateCompany: boolean | undefined;
}

export interface AboutInput {
  name: string;
  slug: string;
  bio: string | undefined;
  imageUrl: string | undefined;
  resumeUrl: string | undefined;
  brands: BrandInput[];
}

function isHttpsUrl( value: string ): boolean {
  return URL.canParse( value ) && new URL( value ).protocol === "https:";
}

// Contentful asset URLs are protocol-relative ("//images.ctfassets.net/...").
function assetUrl( url: string | undefined ): string | null {
  return url ? `https:${url}` : null;
}

function toBrandContent( brand: BrandInput ): BrandContent {
  if( !isHttpsUrl( brand.url ) ) {
    throw new Error( `Brand "${brand.name}" url is not a full https address: "${brand.url}"` );
  }
  return {
    id: brand.id,
    name: brand.name,
    kind: brand.kind ?? null,
    blurb: brand.blurb ?? null,
    history: brand.history ?? null,
    url: brand.url,
    logoUrl: assetUrl( brand.logoUrl ),
    separateCompany: brand.separateCompany ?? false,
  };
}

export function buildAboutContent( input: AboutInput ): AboutContent {
  if( input.resumeUrl !== undefined && !isHttpsUrl( input.resumeUrl ) ) {
    throw new Error( `Author "${input.slug}" resumeUrl is not a full https address: "${input.resumeUrl}"` );
  }
  return {
    name: input.name,
    slug: input.slug,
    bio: input.bio ?? "",
    imageUrl: assetUrl( input.imageUrl ),
    resumeUrl: input.resumeUrl ?? null,
    brands: input.brands.map( toBrandContent ),
  };
}

// The site's own author carries the identity: it must exist and list at least one brand.
export function buildIdentityAbout( authors: AboutInput[] ): AboutContent {
  const input = authors.find( author => author.slug === AUTHOR_SLUG );
  if( !input ) {
    throw new Error( `No author entry with slug "${AUTHOR_SLUG}" in Contentful` );
  }
  const about = buildAboutContent( input );
  if( about.brands.length === 0 ) {
    throw new Error( `Author "${AUTHOR_SLUG}" has no brands; link at least one published brand entry` );
  }
  return about;
}

export function toAboutInput( author: Author ): AboutInput {
  const fields = author.fields;
  return {
    name: fields.name,
    slug: fields.slug,
    bio: fields.bio,
    imageUrl: fields.image?.fields.file?.url,
    resumeUrl: fields.resumeUrl,
    brands: ( fields.brands ?? [] ).flatMap( brand => brand ? [ {
      id: brand.sys.id,
      name: brand.fields.name,
      kind: brand.fields.kind,
      blurb: brand.fields.blurb,
      history: brand.fields.history,
      url: brand.fields.url,
      logoUrl: brand.fields.logo?.fields.file?.url,
      separateCompany: brand.fields.separateCompany,
    } ] : [] ),
  };
}
```

If the generated types make `brand.fields.logo?.fields.file?.url` not a `string | undefined` (for example a locale map), narrow with `typeof url === "string"` in `toAboutInput`; never cast.

- [ ] **Step 4: Resolve brand logos in `getAuthors()`.** In `src/utils/contentfulUtils.ts`, add `include: 2,` to the `getEntries<TypeAuthorSkeleton>` options (author → brand → logo asset is two levels):

```ts
    authorsPromise = client.withoutUnresolvableLinks.getEntries<TypeAuthorSkeleton>({
      content_type: CONTENT_TYPE_AUTHOR,
      include: 2,
      limit: 1000,
    });
```

- [ ] **Step 5: Load the identity author with the rest of the site content.** In `src/lib/siteContent.ts`:

```ts
import { AboutContent, buildIdentityAbout, toAboutInput } from "@/lib/aboutContent";
import { CategoryLanding, getAuthors, getBlogPosts, getCategoryLandings, getHomePages, HomePage } from "@/utils/contentfulUtils";
```

and replace the bottom of the file with:

```ts
export interface SiteContent {
  landings: LandingMap;
  home: HomeContent;
  about: AboutContent;
}

let siteContentPromise: Promise<SiteContent> | null = null;

// One validated load per build, shared by every page's getStaticProps.
export function loadSiteContent(): Promise<SiteContent> {
  if( !siteContentPromise ) {
    siteContentPromise = Promise.all( [ getBlogPosts(), getCategoryLandings(), getHomePages(), getAuthors() ] )
      .then( ( [ posts, landingEntries, homeEntries, authors ] ) => ({
        landings: buildLandingMap( landingEntries.items.map( toLandingInput ), posts.items.map( post => post.fields.category ) ),
        home: buildHomeContent( homeEntries.items.map( toHomeInput ) ),
        about: buildIdentityAbout( authors.items.map( toAboutInput ) ),
      }) );
  }
  return siteContentPromise;
}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm vitest run src/__tests__/lib/aboutContent.test.ts src/__tests__/lib/siteContent.test.ts`
Expected: PASS.

- [ ] **Step 7: Check and commit**

Run: `pnpm format && pnpm lint && pnpm test`

```bash
git add src/lib/aboutContent.ts src/lib/siteContent.ts src/utils/contentfulUtils.ts src/__tests__/lib/aboutContent.test.ts
git commit -m "feat: load and validate the About author and brands"
```

---

### Task 3: Identity structured data and the home page

**Files:**
- Create: `src/lib/structuredData/identity.ts`
- Modify: `src/constants.ts`, `src/lib/socialLinks.ts`, `src/lib/homepageSchema.ts`, `src/pages/index.tsx`
- Test: `src/__tests__/lib/identity.test.ts`; modify `src/__tests__/lib/homepageSchema.test.ts`

**Interfaces:**
- Consumes: `AboutContent`, `BrandContent` (Task 2); `loadSiteContent()` returning `about` (Task 2).
- Produces (in `@/lib/structuredData/identity`):
  - `type SchemaNode = Record<string, unknown>`
  - `PERSON_ID`, `ORGANIZATION_ID`, `ABOUT_URL` string constants
  - `buildIdentityGraph( about: AboutContent ): SchemaNode[]`
  - `withIdentity( about: AboutContent, ...pageNodes: SchemaNode[] ): SchemaNode` (returns `{ "@context", "@graph" }`)
  - `buildAboutPageSchema( about: AboutContent ): SchemaNode`
  - `buildAuthorProfileSchema( about: AboutContent ): SchemaNode` (for any author other than the site's own)
- Produces (in `@/lib/socialLinks`): `SocialLink.isContact?: boolean`, `socialLinkNamed( name: string ): SocialLink`, `GITHUB_LINK: SocialLink`.

- [ ] **Step 1: Add identity constants.** In `src/constants.ts`, after `SITE_URL`:

```ts
export const ORGANIZATION_NAME = "Audeos";
export const ORGANIZATION_LEGAL_NAME = "AUDEOS, LLC";
export const ORGANIZATION_LOGO = `${SITE_URL}/android-chrome-512x512.png`;
export const PERSON_ALTERNATE_NAMES = [ "Benjamin S. Petty", "Ben Petty", "Benny Petty" ];
export const HOME_BASE = { locality: "Seattle", region: "WA", country: "US" } as const;
```

- [ ] **Step 2: Mark Signal as a contact link and share the lookup.** In `src/lib/socialLinks.ts`, add `isContact?: boolean;` to `SocialLink`, add `isContact: true` to the Signal entry, and replace the `LISTENING_LINKS` block with:

```ts
export function socialLinkNamed( name: string ): SocialLink {
  const link = SOCIAL_LINKS.find( socialLink => socialLink.name === name );
  if( !link ) throw new Error( `No social link named "${name}"` );
  return link;
}

const LISTENING_ORDER = [ "SoundCloud", "Mixcloud", "Bandcamp", "Spotify", "YouTube", "Dropbox" ];

export const LISTENING_LINKS: SocialLink[] = LISTENING_ORDER.map( socialLinkNamed );

export const GITHUB_LINK = socialLinkNamed( "GitHub" );
```

- [ ] **Step 3: Write the failing identity tests**

`src/__tests__/lib/identity.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock( "@/utils/contentfulUtils", () => ({}) );

import { AboutContent, BrandContent } from "@/lib/aboutContent";
import { buildAboutPageSchema, buildIdentityGraph } from "@/lib/structuredData/identity";

const PERSON_ID = "https://www.audeos.com/#person";
const ORGANIZATION_ID = "https://www.audeos.com/#organization";

function brand( overrides: Partial<BrandContent> ): BrandContent {
  return { id: "brand", name: "Brand", kind: null, blurb: null, history: null, url: "https://example.com/", logoUrl: null, separateCompany: false, ...overrides };
}

const about: AboutContent = {
  name: "Audeos",
  slug: "audeos",
  bio: "",
  imageUrl: null,
  resumeUrl: "https://ben-petty.com/",
  brands: [
    brand({ id: "fm", name: "audeos.fm", url: "https://audeos.fm/", blurb: "Live radio" }),
    brand({ id: "clothing", name: "The North West Clothing", url: "https://nwclothing.com/", logoUrl: "https://images.ctfassets.net/logo.png" }),
    brand({ id: "cannabis", name: "Northwest Local Cannabis", url: "https://nw-local.com/", separateCompany: true }),
  ],
};

function nodeWithId( graph: Record<string, unknown>[], id: string ) {
  return graph.find( node => node["@id"] === id );
}

describe( "buildIdentityGraph", () => {
  it( "describes the artist with every name, the Seattle home base and profile links without the contact link", () => {
    const person = nodeWithId( buildIdentityGraph( about ), PERSON_ID );
    expect( person ).toMatchObject({
      "@type": "Person",
      "name": "Audeos",
      "alternateName": [ "Benjamin S. Petty", "Ben Petty", "Benny Petty" ],
      "url": "https://www.audeos.com/author/audeos",
      "address": { "@type": "PostalAddress", "addressLocality": "Seattle", "addressRegion": "WA", "addressCountry": "US" },
    });
    expect( person?.sameAs ).toContain( "https://www.instagram.com/Audeos" );
    expect( person?.sameAs ).toContain( "https://ben-petty.com/" );
    expect( JSON.stringify( person?.sameAs ) ).not.toContain( "signal.me" );
    expect( person ).not.toHaveProperty( "image" );
  });

  it( "lists only AUDEOS, LLC's own brands under the Organization, founded by the artist", () => {
    const organization = nodeWithId( buildIdentityGraph( about ), ORGANIZATION_ID );
    expect( organization ).toMatchObject({
      "@type": "Organization",
      "name": "Audeos",
      "legalName": "AUDEOS, LLC",
      "founder": { "@id": PERSON_ID },
    });
    expect( organization?.brand ).toEqual( [
      { "@type": "Brand", "name": "audeos.fm", "url": "https://audeos.fm/", "description": "Live radio" },
      { "@type": "Brand", "name": "The North West Clothing", "url": "https://nwclothing.com/", "logo": "https://images.ctfassets.net/logo.png" },
    ] );
  });

  it( "describes a separate-company brand as its own Organization with the artist among its founders", () => {
    const graph = buildIdentityGraph( about );
    const cannabis = graph.find( node => node.name === "Northwest Local Cannabis" );
    expect( cannabis ).toEqual({
      "@type": "Organization",
      "name": "Northwest Local Cannabis",
      "url": "https://nw-local.com/",
      "founder": [ { "@id": PERSON_ID } ],
    });
  });
});

describe( "buildAboutPageSchema", () => {
  it( "is a ProfilePage about the artist carrying the whole identity graph", () => {
    const schema = buildAboutPageSchema( about );
    expect( schema["@context"] ).toBe( "https://schema.org" );
    const graph = schema["@graph"];
    expect( Array.isArray( graph ) && graph.find( node => node["@type"] === "ProfilePage" ) ).toMatchObject({
      "url": "https://www.audeos.com/author/audeos",
      "mainEntity": { "@id": PERSON_ID },
    });
    expect( Array.isArray( graph ) && nodeWithId( graph, ORGANIZATION_ID ) ).toBeTruthy();
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `pnpm vitest run src/__tests__/lib/identity.test.ts`
Expected: FAIL, cannot resolve `@/lib/structuredData/identity`.

- [ ] **Step 5: Implement `src/lib/structuredData/identity.ts`**

```ts
import {
  AUTHOR_SLUG,
  HOME_BASE,
  META_TITLE,
  ORGANIZATION_LEGAL_NAME,
  ORGANIZATION_LOGO,
  ORGANIZATION_NAME,
  PERSON_ALTERNATE_NAMES,
  SITE_URL,
} from "@/constants";
import type { AboutContent, BrandContent } from "@/lib/aboutContent";
import { ABOUT_LABEL } from "@/lib/navLinks";
import { SOCIAL_LINKS } from "@/lib/socialLinks";

export type SchemaNode = Record<string, unknown>;

export const PERSON_ID = `${SITE_URL}/#person`;
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const ABOUT_URL = `${SITE_URL}/author/${AUTHOR_SLUG}`;

const HOME_BASE_ADDRESS = {
  "@type": "PostalAddress",
  "addressLocality": HOME_BASE.locality,
  "addressRegion": HOME_BASE.region,
  "addressCountry": HOME_BASE.country,
};

function brandDetails( brand: BrandContent ) {
  return {
    "name": brand.name,
    "url": brand.url,
    ...( brand.blurb && { "description": brand.blurb }),
    ...( brand.logoUrl && { "logo": brand.logoUrl }),
  };
}

function buildPerson( about: AboutContent ): SchemaNode {
  const profileUrls = SOCIAL_LINKS.filter( link => !link.isContact ).map( link => link.href );
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    "name": about.name,
    "alternateName": PERSON_ALTERNATE_NAMES,
    "url": ABOUT_URL,
    ...( about.imageUrl && { "image": about.imageUrl }),
    "address": HOME_BASE_ADDRESS,
    "sameAs": about.resumeUrl ? [ ...profileUrls, about.resumeUrl ] : profileUrls,
  };
}

function buildOrganization( about: AboutContent ): SchemaNode {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    "name": ORGANIZATION_NAME,
    "legalName": ORGANIZATION_LEGAL_NAME,
    "url": SITE_URL,
    "logo": ORGANIZATION_LOGO,
    "address": HOME_BASE_ADDRESS,
    "founder": { "@id": PERSON_ID },
    "brand": about.brands
      .filter( brand => !brand.separateCompany )
      .map( brand => ({ "@type": "Brand", ...brandDetails( brand ) }) ),
  };
}

// A brand the owner built that a different company runs: its own Organization, no ownership claim by AUDEOS, LLC.
function buildSeparateCompany( brand: BrandContent ): SchemaNode {
  return { "@type": "Organization", ...brandDetails( brand ), "founder": [ { "@id": PERSON_ID } ] };
}

export function buildIdentityGraph( about: AboutContent ): SchemaNode[] {
  return [
    buildPerson( about ),
    buildOrganization( about ),
    ...about.brands.filter( brand => brand.separateCompany ).map( buildSeparateCompany ),
  ];
}

// Google does not resolve @id across pages, so every page that names the Organization carries the full graph.
export function withIdentity( about: AboutContent, ...pageNodes: SchemaNode[] ): SchemaNode {
  return { "@context": "https://schema.org", "@graph": [ ...buildIdentityGraph( about ), ...pageNodes ] };
}

export function buildAboutPageSchema( about: AboutContent ): SchemaNode {
  return withIdentity( about, {
    "@type": "ProfilePage",
    "url": ABOUT_URL,
    "name": `${ABOUT_LABEL} | ${META_TITLE}`,
    "mainEntity": { "@id": PERSON_ID },
  });
}

// Any other author: a plain profile, no site identity.
export function buildAuthorProfileSchema( about: AboutContent ): SchemaNode {
  const url = `${SITE_URL}/author/${about.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "url": url,
    "mainEntity": {
      "@type": "Person",
      "name": about.name,
      "url": url,
      ...( about.imageUrl && { "image": about.imageUrl }),
    },
  };
}
```

If importing `ABOUT_LABEL` from `@/lib/navLinks` creates a cycle or pulls UI code into tests, move `ABOUT_LABEL` to `src/constants.ts` and re-export it from `navLinks.ts` instead.

- [ ] **Step 6: Run the identity tests to verify they pass**

Run: `pnpm vitest run src/__tests__/lib/identity.test.ts`
Expected: PASS.

- [ ] **Step 7: Name the Organization as the home page's publisher.** In `src/lib/homepageSchema.ts`, import `ORGANIZATION_ID` from `@/lib/structuredData/identity`, delete the `"@context": "https://schema.org",` line (the page wraps the node with `withIdentity`), and add after `"url": SITE_URL,`:

```ts
    "publisher": { "@id": ORGANIZATION_ID },
```

In `src/__tests__/lib/homepageSchema.test.ts`, in the first test replace `expect( schema[ "@context" ] ).toBe( "https://schema.org" );` with:

```ts
    expect( schema.publisher ).toEqual({ "@id": "https://www.audeos.com/#organization" });
```

Type-only imports (`import type`) keep `identity.ts` and `eventsServices.ts` from loading `contentfulUtils` at runtime, so this test needs no new mock.

- [ ] **Step 8: Wrap the home JSON-LD with the identity graph.** In `src/pages/index.tsx`:

```ts
import { SchemaNode, withIdentity } from "@/lib/structuredData/identity";
```

change `schema: ReturnType<typeof buildHomepageSchema>;` to `schema: SchemaNode;`, and replace `getStaticProps` with:

```ts
export async function getStaticProps() {
  const [ posts, { landings, home, about } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );
  generateFeeds( posts.items );
  const schema = withIdentity( about, buildHomepageSchema( posts, landings, home ) );
  return { props: { posts, home, schema } };
}
```

- [ ] **Step 9: Check and commit**

Run: `pnpm format && pnpm lint && pnpm test`
Expected: all pass.

```bash
git add src/constants.ts src/lib/socialLinks.ts src/lib/structuredData/identity.ts src/lib/homepageSchema.ts src/pages/index.tsx src/__tests__/lib/identity.test.ts src/__tests__/lib/homepageSchema.test.ts
git commit -m "feat: identity structured data for Audeos and AUDEOS, LLC on the home page"
```

---

### Task 4: Events services structured data

**Files:**
- Create: `src/lib/structuredData/eventsServices.ts`
- Modify: `src/constants.ts`, `src/components/FilteredArchive/getCategoryStaticProps.ts`, `src/components/FilteredArchive/FilteredArchive.tsx`
- Test: `src/__tests__/lib/eventsServices.test.ts`

**Interfaces:**
- Consumes: `LandingContent`, `PricePackage` from `@/lib/siteContent`; `ORGANIZATION_ID`, `SchemaNode`, `withIdentity` (Task 3); `loadSiteContent()` with `about` (Task 2); `GEAR_ONLY_LABEL`, `WITH_ME_LABEL`, `HIRE_PATH`, `SITE_URL` from `@/constants`.
- Produces: `buildEventsServices( landing: LandingContent ): SchemaNode[]`; `buildCategorySchema( category: CategoryId, page: number, landing: LandingContent, about: AboutContent ): SchemaNode | null` exported from `getCategoryStaticProps.ts`; `FilteredArchiveProps.schema?: SchemaNode | null`.

- [ ] **Step 1: Add the service names.** In `src/constants.ts`, after `DJ_PACKAGES_HEADING`:

```ts
export const DJ_SERVICE_NAME = "DJ services";
export const RENTAL_SERVICE_NAME = "Speaker rental";
```

- [ ] **Step 2: Write the failing tests**

`src/__tests__/lib/eventsServices.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock( "@/utils/contentfulUtils", () => ({}) );

import { buildEventsServices } from "@/lib/structuredData/eventsServices";
import { buildCategorySchema } from "@/components/FilteredArchive/getCategoryStaticProps";
import type { AboutContent } from "@/lib/aboutContent";
import type { LandingContent, PricePackage } from "@/lib/siteContent";

const party: PricePackage = { id: "party", name: "Party / club night", group: "dj", price: 1200, priceOperated: null, priceUnit: "per event", includes: [] };
const pair: PricePackage = { id: "pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [] };

function events( packages: PricePackage[] ): LandingContent {
  return { category: "events", description: "", intro: null, body: null, packages, rentalHeading: null, footnote: null, ctaLabel: null, ctaUrl: null, ogImageUrl: null };
}

const about: AboutContent = {
  name: "Audeos", slug: "audeos", bio: "", imageUrl: null, resumeUrl: null,
  brands: [ { id: "fm", name: "audeos.fm", kind: null, blurb: null, history: null, url: "https://audeos.fm/", logoUrl: null, separateCompany: false } ],
};

describe( "buildEventsServices", () => {
  it( "offers each DJ package once in USD across Seattle, Washington and the United States", () => {
    const [ dj ] = buildEventsServices( events( [ party ] ) );
    expect( dj ).toMatchObject({
      "@type": "Service",
      "name": "DJ services",
      "provider": { "@id": "https://www.audeos.com/#organization" },
      "areaServed": [
        { "@type": "City", "name": "Seattle" },
        { "@type": "State", "name": "Washington" },
        { "@type": "Country", "name": "United States" },
      ],
      "offers": [ { "@type": "Offer", "name": "Party / club night", "price": 1200, "priceCurrency": "USD", "description": "per event" } ],
    });
  });

  it( "offers each rental package twice, gear only and with the owner, across Seattle, Tacoma and Everett", () => {
    const services = buildEventsServices( events( [ party, pair ] ) );
    const rental = services.find( service => service.name === "Speaker rental" );
    expect( rental ).toMatchObject({
      "areaServed": [
        { "@type": "City", "name": "Seattle" },
        { "@type": "City", "name": "Tacoma" },
        { "@type": "City", "name": "Everett" },
      ],
      "offers": [
        { "@type": "Offer", "name": "Pair (Gear only)", "price": 250, "priceCurrency": "USD", "description": "per day" },
        { "@type": "Offer", "name": "Pair (With me)", "price": 600, "priceCurrency": "USD", "description": "per day" },
      ],
    });
  });

  it( "emits no rental service when there are no rental packages", () => {
    expect( buildEventsServices( events( [ party ] ) ).map( service => service.name ) ).toEqual( [ "DJ services" ] );
  });
});

describe( "buildCategorySchema", () => {
  it( "gives only Events page 1 the services and identity graph", () => {
    const eventsPageOne = buildCategorySchema( "events", 1, events( [ party ] ), about );
    expect( JSON.stringify( eventsPageOne ) ).toContain( "DJ services" );
    expect( JSON.stringify( eventsPageOne ) ).toContain( "AUDEOS, LLC" );
    expect( buildCategorySchema( "events", 2, events( [ party ] ), about ) ).toBeNull();
    expect( buildCategorySchema( "music", 1, { ...events( [] ), category: "music" }, about ) ).toBeNull();
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `pnpm vitest run src/__tests__/lib/eventsServices.test.ts`
Expected: FAIL, cannot resolve `@/lib/structuredData/eventsServices`.

- [ ] **Step 4: Implement `src/lib/structuredData/eventsServices.ts`**

```ts
import { DJ_SERVICE_NAME, GEAR_ONLY_LABEL, HIRE_PATH, RENTAL_SERVICE_NAME, SITE_URL, WITH_ME_LABEL } from "@/constants";
import type { LandingContent, PricePackage } from "@/lib/siteContent";
import { ORGANIZATION_ID, type SchemaNode } from "@/lib/structuredData/identity";

// Search layer only: these places never appear as a visible list.
const DJ_AREAS = [
  { "@type": "City", "name": "Seattle" },
  { "@type": "State", "name": "Washington" },
  { "@type": "Country", "name": "United States" },
];
// Rental includes delivery, so it covers the metro area only.
const RENTAL_AREAS = [ "Seattle", "Tacoma", "Everett" ].map( city => ({ "@type": "City", "name": city }) );

function offer( name: string, price: number, priceUnit: string ): SchemaNode {
  return { "@type": "Offer", "name": name, "price": price, "priceCurrency": "USD", "description": priceUnit };
}

function rentalOffers( pricePackage: PricePackage ): SchemaNode[] {
  const gearOnly = offer( `${pricePackage.name} (${GEAR_ONLY_LABEL})`, pricePackage.price, pricePackage.priceUnit );
  if( pricePackage.priceOperated === null ) return [ gearOnly ];
  return [ gearOnly, offer( `${pricePackage.name} (${WITH_ME_LABEL})`, pricePackage.priceOperated, pricePackage.priceUnit ) ];
}

function service( name: string, areaServed: SchemaNode[], offers: SchemaNode[] ): SchemaNode {
  return {
    "@type": "Service",
    "name": name,
    "url": `${SITE_URL}${HIRE_PATH}`,
    "provider": { "@id": ORGANIZATION_ID },
    "areaServed": areaServed,
    "offers": offers,
  };
}

export function buildEventsServices( landing: LandingContent ): SchemaNode[] {
  const djPackages = landing.packages.filter( pricePackage => pricePackage.group === "dj" );
  const rentalPackages = landing.packages.filter( pricePackage => pricePackage.group === "speakerRental" );
  return [
    djPackages.length > 0
      ? service( DJ_SERVICE_NAME, DJ_AREAS, djPackages.map( pricePackage => offer( pricePackage.name, pricePackage.price, pricePackage.priceUnit ) ) )
      : null,
    rentalPackages.length > 0
      ? service( RENTAL_SERVICE_NAME, RENTAL_AREAS, rentalPackages.flatMap( rentalOffers ) )
      : null,
  ].filter( node => node !== null );
}
```

(`buildLandingMap` already fails the build when a rental package has no `priceOperated`; the `null` branch only satisfies the type.)

- [ ] **Step 5: Give Events page 1 its schema.** In `src/components/FilteredArchive/getCategoryStaticProps.ts`:

```ts
import { CategoryId, CATEGORY_TITLES, isCategoryId, META_IMAGE, SITE_URL } from "@/constants";
import type { AboutContent } from "@/lib/aboutContent";
import { LandingContent, loadSiteContent } from "@/lib/siteContent";
import { buildEventsServices } from "@/lib/structuredData/eventsServices";
import { SchemaNode, withIdentity } from "@/lib/structuredData/identity";

// Only Events page 1 shows the price lists, so only it describes the priced services.
export function buildCategorySchema( category: CategoryId, page: number, landing: LandingContent, about: AboutContent ): SchemaNode | null {
  if( category !== "events" || page !== 1 ) return null;
  return withIdentity( about, ...buildEventsServices( landing ) );
}
```

change the load line to `const [ posts, { landings, about } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );`, and add `schema: buildCategorySchema( slugParam, page, landing, about ),` to the returned `props`.

- [ ] **Step 6: Render the schema.** In `src/components/FilteredArchive/FilteredArchive.tsx`, import `JsonLd` from `@/components/JsonLd` and `SchemaNode` from `@/lib/structuredData/identity`, add `schema?: SchemaNode | null` to `FilteredArchiveProps`, destructure it, and inside `<SeoHead>` after the feed links add:

```tsx
        { schema && <JsonLd schema={ schema } /> }
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `pnpm vitest run src/__tests__/lib/eventsServices.test.ts`
Expected: PASS.

- [ ] **Step 8: Check and commit**

Run: `pnpm format && pnpm lint && pnpm test`

```bash
git add src/constants.ts src/lib/structuredData/eventsServices.ts src/components/FilteredArchive/getCategoryStaticProps.ts src/components/FilteredArchive/FilteredArchive.tsx src/__tests__/lib/eventsServices.test.ts
git commit -m "feat: priced DJ and speaker-rental services in the Events structured data"
```

---

### Task 5: About page

**Files:**
- Create: `src/components/About/About.tsx`, `src/styles/About.module.scss`
- Modify: `src/pages/author/[slug].tsx`, `CLAUDE.md`
- Delete: `src/styles/Author.module.scss`
- Test: `src/__tests__/components/About.test.tsx`

**Interfaces:**
- Consumes: `AboutContent`, `buildAboutContent`, `toAboutInput` (Task 2); `loadSiteContent()` (Task 2); `buildAboutPageSchema`, `buildAuthorProfileSchema`, `SchemaNode` (Task 3); `GITHUB_LINK` (Task 3); `VENTURES_HEADING`, `RESUME_LABEL` (Task 1); `ABOUT_LABEL`; `GiantWord`; `Landing.module.scss` classes `landing`, `priceList`, `priceRow`, `listening`.
- Produces: `About` default export taking `{ about: AboutContent }`.

- [ ] **Step 1: Write the failing test**

`src/__tests__/components/About.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import About from "@/components/About/About";
import { AboutContent, BrandContent } from "@/lib/aboutContent";

function brand( overrides: Partial<BrandContent> ): BrandContent {
  return { id: "brand", name: "Brand", kind: null, blurb: null, history: null, url: "https://example.com/", logoUrl: null, separateCompany: false, ...overrides };
}

const about: AboutContent = {
  name: "Audeos",
  slug: "audeos",
  bio: "",
  imageUrl: null,
  resumeUrl: "https://ben-petty.com/",
  brands: [
    brand({ id: "clothing", name: "The North West Clothing", kind: "CLOTHING", blurb: "Pacific Northwest apparel", history: "BEGAN AS CRISIS CLOTHING", url: "https://www.nwclothing.com/" }),
    brand({ id: "cannabis", name: "Northwest Local Cannabis", url: "https://nw-local.com/", separateCompany: true }),
  ],
};

describe( "About", () => {
  it( "shows each brand's label, blurb and history with a link out by its domain", () => {
    render( <About about={ about } /> );
    const [ clothing ] = screen.getAllByRole( "listitem" );
    expect( within( clothing ).getByRole( "heading", { name: "The North West Clothing" }) ).toBeInTheDocument();
    expect( within( clothing ).getByText( "CLOTHING" ) ).toBeInTheDocument();
    expect( within( clothing ).getByText( "Pacific Northwest apparel" ) ).toBeInTheDocument();
    expect( within( clothing ).getByText( "BEGAN AS CRISIS CLOTHING" ) ).toBeInTheDocument();
    expect( within( clothing ).getByRole( "link" ) ).toHaveAttribute( "href", "https://www.nwclothing.com/" );
    expect( within( clothing ).getByRole( "link" ) ).toHaveTextContent( "nwclothing.com" );
  });

  it( "renders a brand with no optional fields as just its name and link, with no ownership label", () => {
    render( <About about={ about } /> );
    const cannabis = screen.getAllByRole( "listitem" )[ 1 ];
    expect( within( cannabis ).queryAllByRole( "paragraph" ) ).toHaveLength( 0 );
    expect( cannabis ).not.toHaveTextContent( /partner|separate/i );
    expect( within( cannabis ).getByRole( "link" ) ).toHaveTextContent( "nw-local.com" );
  });

  it( "links the resume and GitHub", () => {
    render( <About about={ about } /> );
    expect( screen.getByRole( "link", { name: "Resume" }) ).toHaveAttribute( "href", "https://ben-petty.com/" );
    expect( screen.getByRole( "link", { name: "GitHub" }) ).toHaveAttribute( "href", "https://github.com/aud-eos" );
  });
});
```

(The "Resume" name follows `RESUME_LABEL`; if Task 1 approved a different label, use that string.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/__tests__/components/About.test.tsx`
Expected: FAIL, cannot resolve `@/components/About/About`.

- [ ] **Step 3: Implement `src/components/About/About.tsx`**

```tsx
import Image from "next/image";
import { Markdown } from "@/components/Markdown";
import { RESUME_LABEL, VENTURES_HEADING } from "@/constants";
import type { AboutContent } from "@/lib/aboutContent";
import { GITHUB_LINK } from "@/lib/socialLinks";
import landingStyles from "@/styles/Landing.module.scss";
import styles from "@/styles/About.module.scss";

const PHOTO_SIZE = 320;

function displayHost( url: string ): string {
  return new URL( url ).hostname.replace( /^www\./, "" );
}

export default function About({ about }: { about: AboutContent }) {
  return (
    <section className={ landingStyles.landing }>
      <div className={ styles.artist }>
        { about.imageUrl && (
          <Image
            src={ `${about.imageUrl}?w=${PHOTO_SIZE * 2}&h=${PHOTO_SIZE * 2}&fit=fill` }
            alt={ `Photo of ${about.name}` }
            width={ PHOTO_SIZE }
            height={ PHOTO_SIZE }
            className={ styles.photo }
            priority
          />
        ) }
        { about.bio && <div className={ styles.bio }><Markdown>{ about.bio }</Markdown></div> }
      </div>
      { about.brands.length > 0 && (
        <section className={ styles.ventures }>
          <h2 className={ styles.venturesHeading }>{ VENTURES_HEADING }</h2>
          <ul className={ landingStyles.priceList }>
            { about.brands.map( brand => (
              <li key={ brand.id } className={ landingStyles.priceRow }>
                <div className={ styles.brandText }>
                  { brand.kind && <p className={ styles.kind }>{ brand.kind }</p> }
                  <h3 className={ styles.brandName }>{ brand.name }</h3>
                  { brand.blurb && <p className={ styles.blurb }>{ brand.blurb }</p> }
                  { brand.history && <p className={ styles.history }>{ brand.history }</p> }
                </div>
                <a href={ brand.url } className={ styles.brandLink }>{ displayHost( brand.url ) } →</a>
              </li>
            ) ) }
          </ul>
        </section>
      ) }
      <ul className={ landingStyles.listening }>
        { about.resumeUrl && <li><a href={ about.resumeUrl }>{ RESUME_LABEL }</a></li> }
        <li><a href={ GITHUB_LINK.href } title={ GITHUB_LINK.title }>{ GITHUB_LINK.name }</a></li>
      </ul>
    </section>
  );
}
```

If Testing Library's `queryAllByRole( "paragraph" )` is unsupported by the installed `dom` version, assert `cannabis.querySelectorAll( "p" )` has length 0 instead.

- [ ] **Step 4: Add `src/styles/About.module.scss`**

```scss
.artist {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 800px) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.photo {
  width: 100%;
  max-width: 20rem;
  height: auto;
  aspect-ratio: 1;
  object-fit: cover;
  background: var(--hatch);
}

.bio {
  max-width: 44rem;
  font-size: 1.15rem;
  line-height: 1.5;
}

.ventures {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.venturesHeading,
.kind,
.history {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--mute);
}

.brandText {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.brandName {
  font-size: 1.5rem;
  font-weight: 800;
}

.blurb {
  max-width: 36rem;
  line-height: 1.4;
}

.brandLink {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.85rem;
  color: var(--ink);
  text-decoration: none;

  &:hover,
  &:focus-visible {
    color: var(--accent);
  }
}
```

- [ ] **Step 5: Render the About page.** Replace `src/pages/author/[slug].tsx` with:

```tsx
import { GetStaticPropsContext } from "next";
import About from "@/components/About/About";
import GiantWord from "@/components/GiantWord/GiantWord";
import { JsonLd } from "@/components/JsonLd";
import { Layout } from "@/components/Layout/Layout";
import { SeoHead } from "@/components/SeoHead";
import { AUTHOR_SLUG, META_TITLE, SITE_URL } from "@/constants";
import { AboutContent, buildAboutContent, toAboutInput } from "@/lib/aboutContent";
import { ABOUT_LABEL } from "@/lib/navLinks";
import { loadSiteContent } from "@/lib/siteContent";
import { buildAboutPageSchema, buildAuthorProfileSchema, SchemaNode } from "@/lib/structuredData/identity";
import styles from "@/styles/Home.module.scss";
import { getAuthor, getAuthors } from "@/utils/contentfulUtils";
import { stripMarkdown } from "@/utils/stringUtils";

const OG_IMAGE_SIZE = 1200;
const META_DESCRIPTION_LENGTH = 160;

export interface AuthorPageProps {
  about: AboutContent;
  schema: SchemaNode;
}

export default function AuthorPage({ about, schema }: AuthorPageProps ) {
  const ogImage = about.imageUrl ? `${about.imageUrl}?w=${OG_IMAGE_SIZE}` : undefined;
  const description = stripMarkdown( about.bio ).slice( 0, META_DESCRIPTION_LENGTH ) || `${about.name} on ${META_TITLE}`;
  return (
    <>
      <SeoHead
        title={ `${ABOUT_LABEL} | ${META_TITLE}` }
        canonicalUrl={ `${SITE_URL}/author/${about.slug}` }
        description={ description }
        ogType="profile"
        ogImage={ ogImage }
        twitterCard="summary"
      >
        { ogImage && <meta property="og:image:alt" content={ `Photo of ${about.name}` } /> }
        <JsonLd schema={ schema } />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <GiantWord text={ ABOUT_LABEL } />
          <About about={ about } />
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps( context: GetStaticPropsContext ) {
  const slug = context.params?.slug;
  if( typeof slug !== "string" ) {
    throw new Error( `author page: unexpected slug param "${String( slug )}"` );
  }
  if( slug === AUTHOR_SLUG ) {
    const { about } = await loadSiteContent();
    return { props: { about, schema: buildAboutPageSchema( about ) } };
  }
  const author = await getAuthor( slug );
  if( !author ) {
    throw new Error( `author page: no author entry with slug "${slug}"` );
  }
  const about = buildAboutContent( toAboutInput( author ) );
  return { props: { about, schema: buildAuthorProfileSchema( about ) } };
}

export async function getStaticPaths() {
  const authors = await getAuthors();
  return {
    paths: authors.items.map( author => ({ params: { slug: author.fields.slug } }) ),
    fallback: false,
  };
}
```

Then delete `src/styles/Author.module.scss` (`git rm`), and check nothing else imports it: `grep -rn "Author.module" src` must print nothing. If `stripMarkdown` does not accept an empty string, check its signature in `src/utils/stringUtils.ts`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run src/__tests__/components/About.test.tsx`
Expected: PASS.

- [ ] **Step 7: Update `CLAUDE.md`.**
  - Data flow, first bullet: say `getAuthors()` resolves brands and their logos (`include: 2`), and that `loadSiteContent()` also returns `about`, the site author validated by `src/lib/aboutContent.ts` (brands required, https URLs).
  - Add a Data flow bullet: **Identity structured data** comes from `src/lib/structuredData/identity.ts` (`withIdentity` wraps page nodes in one `@graph` with the Person, the AUDEOS, LLC Organization and separate-company Organizations); Google does not resolve `@id` across pages, so every page naming the Organization carries the full graph from this builder, never a hand-written copy. Events page 1 adds `eventsServices.ts`. City names (home base, `areaServed`) live only in structured data, never in visible copy.
  - Routing table: change the `/author/[slug]` note to "About page (giant ABOUT, artist block, ventures, Resume and GitHub links) with ProfilePage JSON-LD".
  - Next to the `Landing/` components bullet, add one for `About/`.

- [ ] **Step 8: Full checks and commit**

Run: `pnpm format && pnpm lint && pnpm test && make build`
Expected: all pass. Then confirm in `dist/`:
- `dist/author/audeos.html` contains "ABOUT" in the giant word, the three brand names, `"legalName":"AUDEOS, LLC"` and `"@type":"ProfilePage"`.
- `dist/category/events.html` contains `"DJ services"`, `"Speaker rental"` and `"priceCurrency":"USD"`; `dist/category/events/page/2.html` (if it exists) and `dist/category/music.html` contain no `"Service"`.
- `dist/index.html` contains `"publisher":{"@id":"https://www.audeos.com/#organization"}`.

```bash
git add -A src/components/About src/styles/About.module.scss src/styles/Author.module.scss src/pages/author CLAUDE.md src/__tests__/components/About.test.tsx
git commit -m "feat: About page with the artist block, ventures list and profile structured data"
```

- [ ] **Step 9: Owner's visual checklist (for the PR description).** In the running dev server: `/author/audeos` on desktop and phone width (giant ABOUT fits, photo and bio, ventures rows, links row); `/category/events` unchanged visually; Google's Rich Results Test on the deployed About and Events pages after merge.
