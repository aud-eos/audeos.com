import { describe, it, expect, vi } from "vitest";

vi.mock( "@/utils/contentfulUtils", () => ({}) );

import { buildHomeContent, buildLandingMap, LandingInput, PackageInput } from "@/lib/siteContent";

const djPackage: PackageInput = {
  id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: undefined, priceUnit: "per event", includes: [ "Up to 4 hrs" ],
};
const rentalPackage: PackageInput = {
  id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [],
};

function landing( category: string, overrides: Partial<LandingInput> = {}): LandingInput {
  return { category, description: `${category} posts`, intro: undefined, body: undefined, packages: [], rentalHeading: undefined, footnote: undefined, ctaLabel: undefined, ctaUrl: undefined, ogImageUrl: undefined, ...overrides };
}

const allThree = [ landing( "music" ), landing( "events", { packages: [ djPackage, rentalPackage ] }), landing( "lifestyle" ) ];

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

  it( "fails when two landings name the same category", () => {
    expect( () => buildLandingMap( [ ...allThree, landing( "events" ) ], [] ) )
      .toThrow( /Category "events" has more than one category landing entry/ );
  });

  it( "fails when a non-events landing sets an Events-only field", () => {
    expect( () => buildLandingMap( [ landing( "music", { footnote: "Travel extra" }), landing( "events" ), landing( "lifestyle" ) ], [] ) )
      .toThrow( /"music" sets Events-only field\(s\): footnote/ );
  });

  it( "fails when a booking link has a label but no URL", () => {
    expect( () => buildLandingMap( [ landing( "music" ), landing( "events", { ctaLabel: "Book a call →" }), landing( "lifestyle" ) ], [] ) )
      .toThrow( /events/ );
  });

  it( "fails when a speaker-rental package has no With me price", () => {
    const broken = { ...rentalPackage, priceOperated: undefined };
    expect( () => buildLandingMap( [ landing( "music" ), landing( "events", { packages: [ broken ] }), landing( "lifestyle" ) ], [] ) )
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
