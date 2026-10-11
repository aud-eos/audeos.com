import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock( "@/constants", async importOriginal => ({
  ...( await importOriginal<typeof import( "@/constants" )>() ),
  POSTS_PER_CATEGORY_SECTION: 6,
}) );
vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );
vi.mock( "@/components/Home/BlogPostList", () => ({
  default: ({
    posts,
    firstCardPriority,
  }: {
    posts: { fields: { slug: string } }[];
    firstCardPriority?: boolean;
  }) => (
    <ul
      data-testid={ `bpl-${posts[0]?.fields.slug ?? "empty"}` }
      data-priority={ firstCardPriority ? "true" : "false" }
      data-count={ posts.length }
    >
      { posts.map( post => <li key={ post.fields.slug }>{ post.fields.slug }</li> ) }
    </ul>
  ),
}) );

import CategoryPostSections from "@/components/Home/CategoryPostSections";
import type { BlogPost, BlogPosts } from "@/utils/contentfulUtils";
import type { CategoryConfigMap } from "@/types/categoryConfig";
import { makeBlogPost } from "../helpers/makeBlogPost";

const categoryConfig: CategoryConfigMap = {
  music: { title: "Music", description: "music", ogImage: null },
  events: { title: "Events", description: "events", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "lifestyle", ogImage: null },
};

const makePost = ({
  slug,
  date,
  category,
}: {
  slug: string;
  date: string;
  category: "music" | "events" | "lifestyle";
}) => makeBlogPost({ id: slug, slug, title: slug, date: `${date}T00:00:00Z`, category });

function makePosts( items: BlogPost[] ): BlogPosts {
  return { total: items.length, skip: 0, limit: items.length, items };
}

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "CategoryPostSections", () => {
  it( "renders three sections in CATEGORY_IDS order", () => {
    const posts = makePosts( [
      makePost({ slug: "m1", date: "2026-04-01", category: "music" }),
      makePost({ slug: "e1", date: "2026-04-02", category: "events" }),
      makePost({ slug: "l1", date: "2026-04-03", category: "lifestyle" }),
    ] );
    const { container } = render(
      <CategoryPostSections
        posts={ posts }
        categoryConfig={ categoryConfig }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 3 );
    expect( sections[0].id ).toBe( "category-events" );
    expect( sections[1].id ).toBe( "category-music" );
    expect( sections[2].id ).toBe( "category-lifestyle" );
  });

  it( "caps each section at POSTS_PER_CATEGORY_SECTION (6) most recent posts", () => {
    const posts = makePosts( [
      makePost({ slug: "m1", date: "2026-04-01", category: "music" }),
      makePost({ slug: "m2", date: "2026-04-02", category: "music" }),
      makePost({ slug: "m3", date: "2026-04-03", category: "music" }),
      makePost({ slug: "m4", date: "2026-04-04", category: "music" }),
      makePost({ slug: "m5", date: "2026-04-05", category: "music" }),
      makePost({ slug: "m6", date: "2026-04-06", category: "music" }),
      makePost({ slug: "m7", date: "2026-04-07", category: "music" }),
      makePost({ slug: "m8", date: "2026-04-08", category: "music" }),
    ] );
    const { getByTestId } = render(
      <CategoryPostSections
        posts={ posts }
        categoryConfig={ categoryConfig }
      />,
    );
    const list = getByTestId( "bpl-m8" );
    expect( list.getAttribute( "data-count" ) ).toBe( "6" );
    const slugs = Array.from( list.querySelectorAll( "li" ) ).map( item => item.textContent );
    expect( slugs ).toEqual( [ "m8", "m7", "m6", "m5", "m4", "m3" ] );
  });

  it( "omits sections with zero posts", () => {
    const posts = makePosts( [ makePost({ slug: "m1", date: "2026-04-01", category: "music" }) ] );
    const { container } = render(
      <CategoryPostSections
        posts={ posts }
        categoryConfig={ categoryConfig }
      />,
    );
    const sections = container.querySelectorAll( "section" );
    expect( sections ).toHaveLength( 1 );
    expect( sections[0].id ).toBe( "category-music" );
  });

  it( "links section header to /category/[id] with config title", () => {
    const posts = makePosts( [ makePost({ slug: "m1", date: "2026-04-01", category: "music" }) ] );
    const { container } = render(
      <CategoryPostSections
        posts={ posts }
        categoryConfig={ categoryConfig }
      />,
    );
    const heading = container.querySelector( "h2 a" );
    expect( heading?.getAttribute( "href" ) ).toBe( "/category/music" );
    expect( heading?.textContent ).toBe( "Music" );
  });

  it( "passes firstCardPriority only to the first non-empty section", () => {
    const posts = makePosts( [
      makePost({ slug: "e1", date: "2026-04-02", category: "events" }),
      makePost({ slug: "l1", date: "2026-04-03", category: "lifestyle" }),
    ] );
    const { getByTestId } = render(
      <CategoryPostSections
        posts={ posts }
        categoryConfig={ categoryConfig }
      />,
    );
    expect( getByTestId( "bpl-e1" ).getAttribute( "data-priority" ) ).toBe( "true" );
    expect( getByTestId( "bpl-l1" ).getAttribute( "data-priority" ) ).toBe( "false" );
  });

  it( "states the category's total post count, not just the posts shown", () => {
    const items = Array.from({ length: 8 }, ( _unused, index ) =>
      makePost({ slug: `e${index}`, date: `2026-04-0${index + 1}`, category: "events" }) );
    const { getByText } = render(
      <CategoryPostSections posts={ makePosts( items ) } categoryConfig={ categoryConfig } />,
    );
    expect( getByText( "See all 8 →" ).getAttribute( "href" ) ).toBe( "/category/events" );
    expect( getByText( "All 8 events →" ).getAttribute( "href" ) ).toBe( "/category/events" );
  });

  it( "throws if a post category is missing from categoryConfig", () => {
    const posts = makePosts( [ makePost({ slug: "x1", date: "2026-04-01", category: "music" }) ] );
    const partialConfig: CategoryConfigMap = {
      events: { title: "Events", description: "events", ogImage: null },
      lifestyle: { title: "Lifestyle", description: "lifestyle", ogImage: null },
    };
    expect( () =>
      render(
        <CategoryPostSections
          posts={ posts }
          categoryConfig={ partialConfig }
        />,
      ),
    ).toThrow( /no categoryConfig entry for "music"/ );
  });
});
