import { Markdown } from "@/components/Markdown";
import EventsLanding from "@/components/Landing/EventsLanding";
import { LandingContent } from "@/lib/siteContent";
import styles from "@/styles/Landing.module.scss";

export default function CategoryLanding({ landing }: { landing: LandingContent }) {
  if( landing.category === "events" ) return <EventsLanding landing={ landing } />;
  if( !landing.intro && !landing.body ) return null;
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
