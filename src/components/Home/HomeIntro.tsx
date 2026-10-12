import Link from "next/link";
import LiveLine from "@/components/Home/LiveLine";
import { HomeContent } from "@/lib/siteContent";
import { HIRE_PATH } from "@/constants";
import styles from "@/styles/Home.module.scss";

export type HomeIntroProps = Pick<HomeContent, "lines" | "showNowPlaying" | "hireLinkLabel">;

export default function HomeIntro({ lines, showNowPlaying, hireLinkLabel }: HomeIntroProps ) {
  return (
    <div className={ styles.homeIntro }>
      { lines.length > 0 && (
        <ul className={ styles.homeLines }>
          { lines.map( ( line, lineIndex ) => <li key={ `${lineIndex}-${line}` }>{ line }</li> ) }
        </ul>
      ) }
      { showNowPlaying && <LiveLine /> }
      <Link href={ HIRE_PATH } className={ styles.hireLink }>{ hireLinkLabel }</Link>
    </div>
  );
}
