import { Markdown } from "@/components/Markdown";
import PriceList from "@/components/Landing/PriceList";
import { LandingContent } from "@/lib/siteContent";
import styles from "@/styles/Landing.module.scss";

export default function EventsLanding({ landing }: { landing: LandingContent }) {
  const djPackages = landing.packages.filter( pricePackage => pricePackage.group === "dj" );
  const rentalPackages = landing.packages.filter( pricePackage => pricePackage.group === "speakerRental" );
  return (
    <section className={ styles.landing }>
      { landing.intro && <div className={ styles.intro }><Markdown>{ landing.intro }</Markdown></div> }
      { djPackages.length > 0 && <PriceList packages={ djPackages } showOperatedPrice={ false } /> }
      { rentalPackages.length > 0 && (
        <section className={ styles.rental }>
          { landing.rentalHeading && <h2 className={ styles.rentalHeading }>{ landing.rentalHeading }</h2> }
          <PriceList packages={ rentalPackages } showOperatedPrice />
        </section>
      ) }
      { landing.footnote && <p className={ styles.footnote }>{ landing.footnote }</p> }
      { landing.ctaLabel && landing.ctaUrl && (
        <a href={ landing.ctaUrl } className={ styles.cta }>{ landing.ctaLabel }</a>
      ) }
      { landing.body && <div className={ styles.body }><Markdown>{ landing.body }</Markdown></div> }
    </section>
  );
}
