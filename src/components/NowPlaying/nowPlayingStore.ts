import { useSyncExternalStore } from "react";
import { STREAM_ORIGIN } from "@/constants";
import { NowPlaying, isChannelDetail, toNowPlaying } from "@/components/NowPlaying/nowPlayingTypes";

export const NOW_PLAYING_URL = `${STREAM_ORIGIN}/api/v1/channels/main`;
const POLL_INTERVAL_MS = 30_000;

export interface NowPlayingState {
  data: NowPlaying | null;
  errored: boolean;
}

const INITIAL_STATE: NowPlayingState = { data: null, errored: false };

let currentState: NowPlayingState = INITIAL_STATE;
const listeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setTimeout> | undefined;

function emit( nextState: NowPlayingState ) {
  currentState = nextState;
  listeners.forEach( listener => listener() );
}

async function fetchOnce() {
  try {
    const response = await fetch( NOW_PLAYING_URL );
    if( !response.ok ) throw new Error( `HTTP ${response.status}` );
    const payload: unknown = await response.json();
    if( !isChannelDetail( payload ) ) throw new Error( "channel payload failed validation" );
    if( listeners.size > 0 ) emit({ data: toNowPlaying( payload ), errored: false });
  } catch {
    if( listeners.size > 0 ) emit({ data: null, errored: true });
  }
}

function schedulePoll() {
  pollTimer = setTimeout( () => {
    if( document.visibilityState === "visible" ) void fetchOnce();
    schedulePoll();
  }, POLL_INTERVAL_MS );
}

function handleVisibility() {
  if( document.visibilityState === "visible" ) void fetchOnce();
}

function subscribe( listener: () => void ) {
  listeners.add( listener );
  if( listeners.size === 1 ) {
    void fetchOnce();
    schedulePoll();
    document.addEventListener( "visibilitychange", handleVisibility );
  }
  return () => {
    listeners.delete( listener );
    if( listeners.size === 0 ) {
      if( pollTimer ) clearTimeout( pollTimer );
      pollTimer = undefined;
      document.removeEventListener( "visibilitychange", handleVisibility );
      currentState = INITIAL_STATE;
    }
  };
}

const getSnapshot = () => currentState;
const getServerSnapshot = () => INITIAL_STATE;

export function useNowPlaying(): NowPlayingState {
  return useSyncExternalStore( subscribe, getSnapshot, getServerSnapshot );
}
