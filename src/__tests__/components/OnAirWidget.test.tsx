import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import OnAirWidget from "@/components/Layout/OnAirWidget";

const payload = {
  slug: "main",
  name: "Audeos",
  description: null,
  tier: "free",
  access: "granted",
  stream_url: "https://audeos.fm/channels/main/stream.m3u8",
  listener_count: 0,
  now_playing: {
    source: "loop_fallback",
    track: { title: "Slappers", artist: "DJ Audeos", started_at: null, duration_ms: null, position_ms: null },
  },
};

afterEach( () => {
  vi.unstubAllGlobals();
});

describe( "OnAirWidget", () => {
  it( "links to the stream and names the current track once loaded", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => payload }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm" );
    await waitFor( () => expect( link.getAttribute( "aria-label" ) ).toContain( "Slappers by DJ Audeos" ) );
  });

  it( "still renders its label and link when the endpoint fails", async () => {
    const failingFetch = vi.fn( async () => { throw new Error( "offline" ); });
    vi.stubGlobal( "fetch", failingFetch );
    render( <OnAirWidget /> );
    await waitFor( () => expect( failingFetch ).toHaveBeenCalled() );
    await act( async () => { await failingFetch.mock.results[0].value.catch( () => undefined ); });
    const link = screen.getByRole( "link", { name: /audeos\.fm, on air/i });
    expect( link.getAttribute( "href" ) ).toBe( "https://audeos.fm" );
  });

  it( "ignores a malformed payload instead of rendering it", async () => {
    const parseJson = vi.fn( async () => ({ track: "x" }) );
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: parseJson }) ) );
    render( <OnAirWidget /> );
    const link = screen.getByRole( "link" );
    await waitFor( () => expect( parseJson ).toHaveBeenCalled() );
    await act( async () => { await parseJson.mock.results[0].value; });
    expect( link.getAttribute( "aria-label" ) ).not.toContain( "Now playing" );
  });
});
