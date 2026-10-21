import { describe, it, expect } from "vitest";
import { isChannelDetail, toNowPlaying } from "@/components/NowPlaying/nowPlayingTypes";

const validPayload = {
  slug: "main",
  name: "Audeos",
  description: null,
  tier: "free",
  access: "granted",
  stream_url: "https://audeos.fm/channels/main/stream.m3u8",
  listener_count: 0,
  now_playing: {
    source: "loop_fallback",
    track: { title: "Slappers", artist: "DJ Audeos", started_at: null, duration_ms: 4636000, position_ms: 3378000 },
  },
};

describe( "isChannelDetail", () => {
  it( "accepts a well-formed payload, including a null track and fields it does not read", () => {
    expect( isChannelDetail( validPayload ) ).toBe( true );
    expect( isChannelDetail({ ...validPayload, now_playing: { source: "live", track: null }, added_later: 1 }) ).toBe( true );
  });

  it( "rejects an unknown source", () => {
    expect( isChannelDetail({ ...validPayload, now_playing: { ...validPayload.now_playing, source: "radio" } }) ).toBe( false );
  });

  it( "rejects a track without a title", () => {
    const track = { ...validPayload.now_playing.track, title: 42 };
    expect( isChannelDetail({ ...validPayload, now_playing: { ...validPayload.now_playing, track } }) ).toBe( false );
  });

  it( "rejects non-object payloads such as an HTML error page parsed as text", () => {
    expect( isChannelDetail( "<html>502</html>" ) ).toBe( false );
    expect( isChannelDetail( null ) ).toBe( false );
  });
});

describe( "toNowPlaying", () => {
  it( "lifts the channel fields and now-playing block into the card's model", () => {
    expect( toNowPlaying({ ...validPayload, now_playing: { source: "loop_fallback", track: null } }) ).toEqual({
      channel: { slug: "main", name: "Audeos", description: null },
      source: "loop_fallback",
      track: null,
      listener_count: 0,
    });
  });
});
