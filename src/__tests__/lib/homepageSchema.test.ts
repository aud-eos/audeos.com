import { describe, it, expect, vi } from "vitest";

// Pin the per-section cap so this test exercises capping, not the configured number.
vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  POSTS_PER_CATEGORY_SECTION: 6,
}) );

import { buildHomepageSchema } from "@/lib/homepageSchema";
import type { HomeContent, LandingContent, LandingMap } from "@/lib/siteContent";
import { CATEGORY_IDS } from "@/constants";

const makeLanding = ( category: LandingContent["category"], description: string ): LandingContent => ({
  category,
  description,
  intro: null,
  body: null,
  packages: [],
  rentalHeading: null,
  footnote: null,
  ctaLabel: null,
  ctaUrl: null,
  ogImageUrl: null,
});

const landings: LandingMap = {
  music: makeLanding( "music", "Music posts" ),
  events: makeLanding( "events", "Event posts" ),
  lifestyle: makeLanding( "lifestyle", "Lifestyle posts" ),
};

const home: HomeContent = {
  seoTitle: "Audeos",
  seoDescription: "Listen, tune in, or book a DJ set.",
  lines: [],
  showNowPlaying: false,
  hireLinkLabel: "DJ FOR HIRE →",
};

const makePost = ({
  id,
  slug,
  title,
  date,
  category,
  imageUrl,
}: {
  id: string;
  slug: string;
  title: string;
  date: string;
  category: string;
  imageUrl?: string;
}) => ({
  sys: { id, createdAt: date },
  fields: {
    slug,
    title,
    date,
    category,
    image: imageUrl
      ? { fields: { file: { url: imageUrl }, description: "" } }
      : undefined,
  },
  metadata: { tags: [] },
});

// Sections render in CATEGORY_IDS order; look one up by category instead of by position.
function sectionFor( schema: ReturnType<typeof buildHomepageSchema>, categoryId: ( typeof CATEGORY_IDS )[number] ) {
  return schema.hasPart[CATEGORY_IDS.indexOf( categoryId )];
}

describe( "buildHomepageSchema", () => {
  it( "returns a top-level CollectionPage with site metadata", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
      ] } as never,
      landings,
      home,
    );
    expect( schema[ "@context" ] ).toBe( "https://schema.org" );
    expect( schema[ "@type" ] ).toBe( "CollectionPage" );
    expect( schema.name ).toBe( "Audeos" );
    expect( schema.description ).toBe( "Listen, tune in, or book a DJ set." );
    expect( schema.url ).toBeDefined();
    expect( schema.isPartOf ).toMatchObject({ "@type": "WebSite" });
  });

  it( "has hasPart with three inner CollectionPages in CATEGORY_IDS order", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
        makePost({ id: "2", slug: "e1", title: "E1", date: "2026-04-02", category: "events" }),
        makePost({ id: "3", slug: "l1", title: "L1", date: "2026-04-03", category: "lifestyle" }),
      ] } as never,
      landings,
      home,
    );
    expect( schema.hasPart ).toHaveLength( 3 );
    expect( schema.hasPart.map( ( section: { url: string }) => section.url ) ).toEqual(
      CATEGORY_IDS.map( categoryId => `https://www.audeos.com/category/${categoryId}` ),
    );
    expect( sectionFor( schema, "music" ) ).toMatchObject({
      "@type": "CollectionPage",
      "name": "Music",
      "description": "Music posts",
      "url": "https://www.audeos.com/category/music",
    });
  });

  it( "includes up to POSTS_PER_CATEGORY_SECTION posts per category, newest first", () => {
    const items = [];
    for( let dayIndex = 1; dayIndex <= 8; dayIndex++ ) {
      const day = String( dayIndex ).padStart( 2, "0" );
      items.push( makePost({
        id: `m${dayIndex}`,
        slug: `m${dayIndex}`,
        title: `M${dayIndex}`,
        date: `2026-04-${day}`,
        category: "music",
      }) );
    }
    const schema = buildHomepageSchema({ items } as never, landings, home );
    const musicSection = sectionFor( schema, "music" );
    expect( musicSection.hasPart ).toHaveLength( 6 );
    const slugs = musicSection.hasPart.map( ( post: { url: string }) => post.url );
    expect( slugs[0] ).toContain( "m8" );
    expect( slugs[5] ).toContain( "m3" );
  });

  it( "produces an inner BlogPosting per post with required fields", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({
          id: "1",
          slug: "with-img",
          title: "With Image",
          date: "2026-04-01",
          category: "music",
          imageUrl: "//img/1.jpg",
        }),
        makePost({
          id: "2",
          slug: "no-img",
          title: "No Image",
          date: "2026-04-02",
          category: "music",
        }),
      ] } as never,
      landings,
      home,
    );
    const musicSection = sectionFor( schema, "music" );
    expect( musicSection.hasPart[0] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "No Image",
      "url": "https://www.audeos.com/post/no-img",
      "datePublished": "2026-04-02",
    });
    expect( musicSection.hasPart[0].image ).toBeUndefined();
    expect( musicSection.hasPart[1] ).toMatchObject({
      "@type": "BlogPosting",
      "headline": "With Image",
      "image": "https://img/1.jpg",
    });
  });

  it( "renders inner CollectionPage with empty hasPart for empty categories", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
      ] } as never,
      landings,
      home,
    );
    expect( sectionFor( schema, "events" ).hasPart ).toEqual( [] );
    expect( sectionFor( schema, "lifestyle" ).hasPart ).toEqual( [] );
  });

  it( "does not include posts from other categories in a section's hasPart", () => {
    const schema = buildHomepageSchema(
      { items: [
        makePost({ id: "1", slug: "m1", title: "M1", date: "2026-04-01", category: "music" }),
        makePost({ id: "2", slug: "e1", title: "E1", date: "2026-04-01", category: "events" }),
      ] } as never,
      landings,
      home,
    );
    const musicSection = sectionFor( schema, "music" );
    const eventsSection = sectionFor( schema, "events" );
    expect( musicSection.hasPart ).toHaveLength( 1 );
    expect( musicSection.hasPart[0].url ).toContain( "m1" );
    expect( eventsSection.hasPart ).toHaveLength( 1 );
    expect( eventsSection.hasPart[0].url ).toContain( "e1" );
  });
});
