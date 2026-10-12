import { describe, it, expect } from "vitest";
import { buildNavLinks, isActivePath } from "@/lib/navLinks";

const categoryConfig = {
  events: { title: "Events", description: "", ogImage: null },
  music: { title: "Music", description: "", ogImage: null },
  lifestyle: { title: "Lifestyle", description: "", ogImage: null },
};

describe( "buildNavLinks", () => {
  it( "lists Music, Events, Lifestyle, then About", () => {
    expect( buildNavLinks( categoryConfig ) ).toEqual( [
      { href: "/category/music", label: "Music" },
      { href: "/category/events", label: "Events" },
      { href: "/category/lifestyle", label: "Lifestyle" },
      { href: "/author/audeos", label: "About" },
    ] );
  });

  it( "fails loudly when a category has no config", () => {
    expect( () => buildNavLinks({ music: categoryConfig.music, lifestyle: categoryConfig.lifestyle }) )
      .toThrow( /events/ );
  });
});

describe( "isActivePath", () => {
  it( "matches the section page and its paginated pages", () => {
    expect( isActivePath( "/category/events", "/category/events" ) ).toBe( true );
    expect( isActivePath( "/category/events/page/3", "/category/events" ) ).toBe( true );
  });

  it( "ignores query strings and hashes", () => {
    expect( isActivePath( "/category/music?ref=x#posts", "/category/music" ) ).toBe( true );
  });

  it( "does not match a different section that shares a prefix", () => {
    expect( isActivePath( "/category/eventsarchive", "/category/events" ) ).toBe( false );
    expect( isActivePath( "/", "/category/events" ) ).toBe( false );
  });
});
