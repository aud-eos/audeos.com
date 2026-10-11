import { useEffect, useReducer } from "react";
import { STREAM_ORIGIN, STREAM_CHANNEL_URL } from "@/constants";
import { NowPlaying } from "@/components/NowPlaying/nowPlayingTypes";
import { useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";
import styles from "./NowPlayingCard.module.scss";

const PROGRESS_TICK_MS = 1_000;

function formatMs( ms: number ): string {
  const totalSeconds = Math.floor( ms / 1000 );
  const hours = Math.floor( totalSeconds / 3600 );
  const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
  const seconds = totalSeconds % 60;
  if( hours > 0 ) {
    const minutesPadded = minutes.toString().padStart( 2, "0" );
    const secondsPadded = seconds.toString().padStart( 2, "0" );
    return `${hours}:${minutesPadded}:${secondsPadded}`;
  }
  const secondsPadded = seconds.toString().padStart( 2, "0" );
  return `${minutes}:${secondsPadded}`;
}

type State = {
  data: NowPlaying | null;
  errored: boolean;
  displayPositionMs: number;
  epoch: number;
};

type Action =
  | { type: "data"; payload: NowPlaying }
  | { type: "error" }
  | { type: "tick"; epoch: number };

function reducer( state: State, action: Action ): State {
  switch ( action.type ) {
  case "data":
    return {
      data: action.payload,
      errored: false,
      displayPositionMs: action.payload.track?.position_ms ?? 0,
      epoch: state.epoch + 1,
    };
  case "error":
    return { ...state, errored: true };
  case "tick": {
    if( action.epoch !== state.epoch ) return state;
    const durationMs = state.data?.track?.duration_ms ?? 0;
    return {
      ...state,
      displayPositionMs: Math.min( state.displayPositionMs + PROGRESS_TICK_MS, durationMs ),
    };
  }
  }
}

const SOURCE_LABEL: Record<NowPlaying["source"], string> = {
  live: "● Live now",
  scheduled: "Scheduled show",
  loop_fallback: "On rotation",
};

const INITIAL_STATE: State = { data: null, errored: false, displayPositionMs: 0, epoch: 0 };

export default function NowPlayingCard() {
  const [ state, dispatch ] = useReducer( reducer, INITIAL_STATE );
  const { data, errored, displayPositionMs, epoch } = state;

  const nowPlaying = useNowPlaying();

  useEffect( () => {
    if( nowPlaying.data ) {
      dispatch({ type: "data", payload: nowPlaying.data });
    } else if( nowPlaying.errored ) {
      dispatch({ type: "error" });
    }
  }, [ nowPlaying ] );

  useEffect( () => {
    if( !data?.track ) return;
    if( data.track.duration_ms === null ) return;
    const capturedEpoch = epoch;
    const interval = setInterval( () => {
      dispatch({ type: "tick", epoch: capturedEpoch });
    }, PROGRESS_TICK_MS );
    return () => clearInterval( interval );
  }, [ data, epoch ] );

  if( errored ) {
    return (
      <a
        href={ STREAM_CHANNEL_URL }
        target="_blank"
        rel="noopener noreferrer"
        className={ styles.offline }
      >
        <p className={ styles.sourceLabel }>● Stream offline</p>
        <p className={ styles.offlineCta }>Visit player →</p>
      </a>
    );
  }

  if( !data ) {
    return <div data-testid="now-playing-skeleton" className={ styles.skeleton } />;
  }

  return (
    <a
      href={ `${STREAM_ORIGIN}/channels/${data.channel.slug}` }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.card }
    >
      <div className={ styles.content }>
        <p className={ styles.sourceLabel }>
          { SOURCE_LABEL[data.source] }
          <span className={ styles.eq } aria-hidden="true">
            <span /><span /><span /><span />
          </span>
        </p>
        { data.track && (
          <div className={ styles.trackInfo }>
            <h2 className={ styles.trackTitle }>{ data.track.title }</h2>
            { data.track.artist && (
              <p className={ styles.artist }>{ data.track.artist }</p>
            ) }
            { data.track.duration_ms !== null && data.track.duration_ms > 0 && (
              <div className={ styles.progress }>
                <div className={ styles.progressTrack }>
                  <div
                    data-testid="now-playing-progress-fill"
                    className={ styles.progressFill }
                    style={ {
                      width: `${Math.min( 100, ( displayPositionMs / data.track.duration_ms ) * 100 )}%`,
                    } }
                  />
                </div>
                <span className={ styles.progressTime }>
                  { formatMs( displayPositionMs ) } / { formatMs( data.track.duration_ms ) }
                </span>
              </div>
            ) }
          </div>
        ) }
        { data.next_track && (
          <p className={ styles.upNext }>
            Up next · { data.next_track.title }
            { data.next_track.artist && ` · ${data.next_track.artist}` }
          </p>
        ) }
        <div className={ styles.footer }>
          <p data-testid="now-playing-channel-info" className={ styles.channelInfo }>
            { data.channel.name }
            { data.channel.description && ` · ${data.channel.description}` }
          </p>
          <div className={ styles.footerRow }>
            <span className={ styles.listenerCount }>
              { data.listener_count } listening
            </span>
            <span className={ styles.cta }>Tune in →</span>
          </div>
        </div>
      </div>
    </a>
  );
}
