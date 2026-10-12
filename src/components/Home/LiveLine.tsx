import { useNowPlaying } from "@/components/NowPlaying/nowPlayingStore";
import { LIVE_LINE_PREFIX, STREAM_CHANNEL_URL } from "@/constants";
import styles from "@/styles/Home.module.scss";

// The corner widget already shows the stream, so this line simply disappears while there's no track.
export default function LiveLine() {
  const { data } = useNowPlaying();
  if( !data?.track ) return null;
  const { title, artist } = data.track;
  const track = artist ? `${title} — ${artist}` : title;
  return (
    <p className={ styles.liveLine }>
      <a href={ STREAM_CHANNEL_URL }>{ LIVE_LINE_PREFIX }: { track }</a>
    </p>
  );
}
