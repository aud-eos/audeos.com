import { STREAM_CHANNEL_URL } from "@/constants";
import { NowPlayingState, useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";
import styles from "@/styles/OnAirWidget.module.scss";

const STATION_LABEL = "audeos.fm";

function describeStation({ data }: NowPlayingState ): string {
  const track = data?.track;
  if( !track ) return `${STATION_LABEL}, on air`;
  const byline = track.artist ? ` by ${track.artist}` : "";
  return `${STATION_LABEL}, on air. Now playing ${track.title}${byline}`;
}

export default function OnAirWidget() {
  const description = describeStation( useNowPlaying() );
  return (
    <a
      href={ STREAM_CHANNEL_URL }
      target="_blank"
      rel="noopener noreferrer"
      className={ styles.onAir }
      aria-label={ description }
      title={ description }
    >
      <span className={ styles.dot } aria-hidden="true" />
      <span className={ styles.desktopLabel } aria-hidden="true">{ STATION_LABEL }</span>
      <span className={ styles.phoneLabel } aria-hidden="true">On air</span>
    </a>
  );
}
