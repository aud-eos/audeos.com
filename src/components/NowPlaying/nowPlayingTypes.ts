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
  listener_count: number;
}

/** The body of `GET /api/v1/channels/{slug}` on audeos.fm, as far as this site reads it. */
export interface ChannelDetail {
  slug: string;
  name: string;
  description: string | null;
  listener_count: number;
  now_playing: { source: NowPlayingSource; track: NowPlayingTrack | null };
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

function isSource( value: unknown ): value is NowPlayingSource {
  return typeof value === "string" && SOURCES.includes( value );
}

export function isChannelDetail( value: unknown ): value is ChannelDetail {
  if( !isRecord( value ) ) return false;
  const nowPlaying = value.now_playing;
  if( !isRecord( nowPlaying ) ) return false;
  return typeof value.slug === "string"
    && typeof value.name === "string"
    && isNullableString( value.description )
    && typeof value.listener_count === "number"
    && isSource( nowPlaying.source )
    && ( nowPlaying.track === null || isTrack( nowPlaying.track ) );
}

export function toNowPlaying( detail: ChannelDetail ): NowPlaying {
  return {
    channel: { slug: detail.slug, name: detail.name, description: detail.description },
    source: detail.now_playing.source,
    track: detail.now_playing.track,
    listener_count: detail.listener_count,
  };
}
