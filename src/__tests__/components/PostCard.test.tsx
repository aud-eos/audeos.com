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
import { makeBlogPost } from "../helpers/makeBlogPost";

const COVER_URL = "//images.ctfassets.net/flyer.png";

describe( "cardDataFromPost", () => {
  it( "carries the cover's real dimensions", () => {
    const post = makeBlogPost({
      cover: { url: COVER_URL, description: "Flyer", dimensions: { width: 1080, height: 1350 } },
    });
    const card = cardDataFromPost( post, "Events" );
    expect( card.image ).toEqual({ url: COVER_URL, alt: "Flyer", width: 1080, height: 1350 });
    expect( card.href ).toBe( "/post/kick-off-day-party" );
  });

  it( "has no image when the post has no cover", () => {
    expect( cardDataFromPost( makeBlogPost(), "Events" ).image ).toBeNull();
  });

  it( "fails the build when the cover image has no dimensions", () => {
    const post = makeBlogPost({ cover: { url: COVER_URL } });
    expect( () => cardDataFromPost( post, "Events" ) ).toThrow( /kick-off-day-party/ );
  });
});

describe( "PostCard", () => {
  const card = {
    href: "/post/kick-off-day-party",
    title: "Kick Off Day Party",
    timestamp: "2026-06-11",
    categoryLabel: "Events",
    image: { url: COVER_URL, alt: "Flyer", width: 1080, height: 1350 },
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
