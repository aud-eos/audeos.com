import { useRef } from "react";
import AudeosLogo from "@/components/GiantWord/AudeosLogo";
import { useFitWidth } from "@/components/GiantWord/useFitWidth";
import styles from "@/styles/GiantWord.module.scss";

export interface GiantWordProps {
  text: string;
  stackedLogoOnPhone?: boolean;
}

export default function GiantWord({ text, stackedLogoOnPhone = false }: GiantWordProps ) {
  const wordRef = useRef<HTMLSpanElement>( null );
  useFitWidth( wordRef, text );
  const wordClassName = stackedLogoOnPhone ? `${styles.word} ${styles.desktopOnly}` : styles.word;
  return (
    <div className={ styles.giant }>
      <h1 className={ styles.heading }>
        <span ref={ wordRef } className={ wordClassName }>{ text }</span>
        { stackedLogoOnPhone && <AudeosLogo className={ styles.phoneLogo } /> }
      </h1>
    </div>
  );
}
