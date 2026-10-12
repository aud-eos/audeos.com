import { describe, it, expect } from "vitest";
import { isNowPlaying } from "@/components/NowPlaying/nowPlayingTypes";

const validPayload = {
  channel: { slug: "main", name: "Audeos", description: null },
  source: "loop_fallback",
  track: { title: "Slappers", artist: "DJ Audeos", started_at: null, duration_ms: 4636000, position_ms: 3378000 },
  next_track: { title: "Rear Wax (2010)", artist: "DJ Audeos" },
  listener_count: 0,
};

describe( "isNowPlaying", () => {
  it( "accepts a well-formed payload, including a null track", () => {
    expect( isNowPlaying( validPayload ) ).toBe( true );
    expect( isNowPlaying({ ...validPayload, track: null, next_track: null }) ).toBe( true );
  });

  it( "rejects an unknown source", () => {
    expect( isNowPlaying({ ...validPayload, source: "radio" }) ).toBe( false );
  });

  it( "rejects a track without a title", () => {
    expect( isNowPlaying({ ...validPayload, track: { ...validPayload.track, title: 42 } }) ).toBe( false );
  });

  it( "rejects non-object payloads such as an HTML error page parsed as text", () => {
    expect( isNowPlaying( "<html>502</html>" ) ).toBe( false );
    expect( isNowPlaying( null ) ).toBe( false );
  });
});
