import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OnAirWidget from "@/components/Layout/OnAirWidget";

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

describe( "OnAirWidget", () => {
  it( "links to the stream and names the current track once loaded", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => payload }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm/channels/main" );
    await waitFor( () => expect( link.getAttribute( "aria-label" ) ).toContain( "Slappers by DJ Audeos" ) );
  });

  it( "still renders its label and link when the endpoint fails", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => { throw new Error( "offline" ); }) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link", { name: /audeos\.fm, on air/i });
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm/channels/main" );
  });

  it( "ignores a malformed payload instead of rendering it", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => ({ track: "x" }) }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    await waitFor( () => expect( fetch ).toHaveBeenCalled() );
    expect( link.getAttribute( "aria-label" ) ).not.toContain( "Now playing" );
  });
});
