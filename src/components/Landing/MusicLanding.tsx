import { Markdown } from "@/components/Markdown";
import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";
import { LandingContent } from "@/lib/siteContent";
import { LISTENING_LINKS } from "@/lib/socialLinks";
import styles from "@/styles/Landing.module.scss";

export default function MusicLanding({ landing }: { landing: LandingContent }) {
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      <NowPlayingCard />
      <ul className={ styles.listening }>
        { LISTENING_LINKS.map( link => (
          <li key={ link.href }>
            <a href={ link.href } title={ link.title }>{ link.name }</a>
          </li>
        ) ) }
      </ul>
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
