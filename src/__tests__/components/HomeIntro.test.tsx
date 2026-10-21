import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import React from "react";

vi.mock( "next/link", () => ({
  default: ({ children, href, ...props }: React.ComponentProps<"a"> ) => <a href={ href } { ...props }>{ children }</a>,
}) );

import HomeIntro from "@/components/Home/HomeIntro";

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

describe( "HomeIntro", () => {
  it( "renders the stacked lines in order and links the hire label to Events", () => {
    render( <HomeIntro lines={ [ "MUSIC, EVENTS, LIFESTYLE", "SECOND LINE" ] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( screen.getAllByRole( "listitem" ).map( item => item.textContent ) ).toEqual( [ "MUSIC, EVENTS, LIFESTYLE", "SECOND LINE" ] );
    expect( screen.getByRole( "link", { name: "DJ FOR HIRE →" }).getAttribute( "href" ) ).toBe( "/category/events" );
  });

  it( "renders no empty stack when there are no lines", () => {
    const { container } = render( <HomeIntro lines={ [] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( container.querySelector( "ul" ) ).toBeNull();
    expect( screen.getByRole( "link", { name: "DJ FOR HIRE →" }) ).toBeInTheDocument();
  });

  it( "shows the current track when the live line is on", async () => {
    vi.stubGlobal( "fetch", vi.fn( async () => ({ ok: true, status: 200, json: async () => payload }) ) );
    render( <HomeIntro lines={ [] } showNowPlaying={ true } hireLinkLabel="DJ FOR HIRE →" /> );
    await waitFor( () => expect( screen.getByText( /Slappers — DJ Audeos/ ) ).toBeInTheDocument() );
  });

  it( "drops the live line quietly when audeos.fm is down", async () => {
    const failingFetch = vi.fn( async () => { throw new Error( "offline" ); });
    vi.stubGlobal( "fetch", failingFetch );
    render( <HomeIntro lines={ [ "MUSIC, EVENTS, LIFESTYLE" ] } showNowPlaying={ true } hireLinkLabel="DJ FOR HIRE →" /> );
    await waitFor( () => expect( failingFetch ).toHaveBeenCalled() );
    await act( async () => { await failingFetch.mock.results[0].value.catch( () => undefined ); });
    expect( screen.queryByText( /now playing on audeos\.fm/i ) ).toBeNull();
    expect( screen.getByText( "MUSIC, EVENTS, LIFESTYLE" ) ).toBeInTheDocument();
  });

  it( "never polls the stream when the live line is off", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal( "fetch", fetchSpy );
    render( <HomeIntro lines={ [] } showNowPlaying={ false } hireLinkLabel="DJ FOR HIRE →" /> );
    expect( fetchSpy ).not.toHaveBeenCalled();
  });
});
