import Link from "next/link";
import { FC } from "react";
import { SOCIAL_LINKS } from "@/lib/socialLinks";
import { resetCookieConsent } from "@/components/CookieConsent";
import styles from "@/styles/Layout.module.scss";

const ICON_SIZE = 36;

export const Footer: FC = () => {
  return (
    <footer className={ styles.footer }>

      <div className={ styles.socialLinks }>
        { SOCIAL_LINKS.map( ({ href, icon: Icon, title }) => (
          <Link
            key={ href }
            href={ href }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon size={ ICON_SIZE } title={ title } />
          </Link>
        ) ) }
      </div>

      <div>
        <p>
          © { new Date().getFullYear() } Audeos, LLC | All Rights Reserved
        </p>
      </div>

      <div className={ styles.utilityLinks }>
        <Link
          href="https://status.audeos.fm"
          target="_blank"
          rel="noopener noreferrer"
          className={ styles.utilityLink }
        >
          Stream status
        </Link>
        <span className={ styles.utilityDivider } aria-hidden="true">·</span>
        <button className={ styles.utilityLink } onClick={ resetCookieConsent }>
          Update Cookie Preferences
        </button>
      </div>

    </footer>
  );
};
