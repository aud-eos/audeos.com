import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock( "@/components/Markdown", () => ({
  Markdown: ({ children }: { children?: string }) => <p>{ children }</p>,
}) );

vi.mock( "@/components/NowPlaying/NowPlayingCard", () => ({
  default: () => <div data-testid="now-playing-card" />,
}) );

import CategoryLanding from "@/components/Landing/CategoryLanding";
import { LandingContent, PricePackage } from "@/lib/siteContent";

const party: PricePackage = { id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: null, priceUnit: "per event", includes: [] };
const pair: PricePackage = { id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [] };

function landing( overrides: Partial<LandingContent> ): LandingContent {
  return { category: "events", description: "", intro: null, body: null, packages: [], rentalHeading: null, footnote: null, ctaLabel: null, ctaUrl: null, ogImageUrl: null, ...overrides };
}

describe( "CategoryLanding", () => {
  it( "renders nothing for a landing with no intro or body", () => {
    const { container } = render( <CategoryLanding landing={ landing({ category: "lifestyle" }) } /> );
    expect( container ).toBeEmptyDOMElement();
  });

  it( "renders the Events intro, both price lists, footnote and booking link", () => {
    render( <CategoryLanding
      landing={ landing({
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

  it( "renders the Music intro, the audeos.fm player and every listening link", () => {
    render( <CategoryLanding
      landing={ landing({
        category: "music",
        intro: "Original music, DJ mixes, edits and playlists. Tune in to the live stream on audeos.fm.",
      }) } /> );
    expect( screen.getByTestId( "now-playing-card" ) ).toBeInTheDocument();
    expect( screen.getAllByRole( "link" ).map( link => link.textContent ) )
      .toEqual( [ "SoundCloud", "Mixcloud", "Bandcamp", "Spotify", "YouTube", "Dropbox" ] );
    expect( screen.queryByRole( "heading", { name: "Speaker rental" }) ).toBeNull();
  });
});
