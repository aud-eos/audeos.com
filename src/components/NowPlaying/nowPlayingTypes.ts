export type NowPlayingSource = "live" | "scheduled" | "loop_fallback";

export interface NowPlayingTrack {
  title: string;
  artist: string | null;
  started_at: string | null;
  duration_ms: number | null;
  position_ms: number | null;
}

export interface NowPlaying {
  channel: { slug: string; name: string; description: string | null };
  source: NowPlayingSource;
  track: NowPlayingTrack | null;
  next_track: { title: string; artist: string | null } | null;
  listener_count: number;
}

const SOURCES: readonly string[] = [ "live", "scheduled", "loop_fallback" ];

function isRecord( value: unknown ): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString( value: unknown ): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber( value: unknown ): value is number | null {
  return value === null || typeof value === "number";
}

function isTrack( value: unknown ): value is NowPlayingTrack {
  return isRecord( value )
    && typeof value.title === "string"
    && isNullableString( value.artist )
    && isNullableString( value.started_at )
    && isNullableNumber( value.duration_ms )
    && isNullableNumber( value.position_ms );
}

function isNextTrack( value: unknown ): value is NowPlaying["next_track"] {
  return value === null
    || ( isRecord( value ) && typeof value.title === "string" && isNullableString( value.artist ) );
}

export function isNowPlaying( value: unknown ): value is NowPlaying {
  if( !isRecord( value ) ) return false;
  const channel = value.channel;
  if( !isRecord( channel ) ) return false;
  return typeof channel.slug === "string"
    && typeof channel.name === "string"
    && isNullableString( channel.description )
    && typeof value.source === "string"
    && SOURCES.includes( value.source )
    && ( value.track === null || isTrack( value.track ) )
    && isNextTrack( value.next_track )
    && typeof value.listener_count === "number";
}
