import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock( "@/utils/contentfulUtils", () => ({}) );
vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => (
    <a href={ href } { ...props }>{ children }</a>
  ),
}) );

import PostCard, { cardImageFromPost } from "@/components/PostCard/PostCard";
import { makeBlogPost } from "../helpers/makeBlogPost";

const COVER_URL = "//images.ctfassets.net/flyer.png";

describe( "cardImageFromPost", () => {
  it( "carries the cover's real dimensions", () => {
    const post = makeBlogPost({
      cover: { url: COVER_URL, description: "Flyer", dimensions: { width: 1080, height: 1350 } },
    });
    expect( cardImageFromPost( post ) ).toEqual({ url: COVER_URL, alt: "Flyer", width: 1080, height: 1350 });
  });

  it( "has no image when the post has no cover", () => {
    expect( cardImageFromPost( makeBlogPost() ) ).toBeNull();
  });

  it( "fails the build when the cover image has no dimensions", () => {
    const post = makeBlogPost({ cover: { url: COVER_URL } });
    expect( () => cardImageFromPost( post ) ).toThrow( /kick-off-day-party/ );
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

  it( "names the link by the title alone", () => {
    render( <PostCard card={ card } /> );
    expect( screen.getByRole( "link", { name: "Kick Off Day Party" }) ).toBeInTheDocument();
  });

  it( "keeps the hatch until the cover has loaded", () => {
    const { container } = render( <PostCard card={ card } /> );
    const frame = container.querySelector( "[data-frame]" );
    expect( frame?.hasAttribute( "data-loaded" ) ).toBe( false );
    const image = container.querySelector( "img" );
    if( !image ) throw new Error( "expected a cover image" );
    fireEvent.load( image );
    expect( frame?.hasAttribute( "data-loaded" ) ).toBe( true );
  });

  it( "keeps the hatch on the placeholder", () => {
    const { container } = render( <PostCard card={ { ...card, image: null } } /> );
    expect( container.querySelector( "[data-frame]" )?.hasAttribute( "data-loaded" ) ).toBe( false );
  });
});
