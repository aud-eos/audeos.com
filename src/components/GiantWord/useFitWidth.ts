import { RefObject, useEffect } from "react";
import { onFontsReady } from "@/utils/onFontsReady";

const MEASURE_SIZE_PX = 100;

// Sizes the word so the whole word fills its container's width on every screen size.
export function useFitWidth( wordRef: RefObject<HTMLElement | null>, text: string ): void {
  useEffect( () => {
    const word = wordRef.current;
    const container = word?.parentElement;
    if( !word || !container ) return;

    const fit = () => {
      word.style.fontSize = `${MEASURE_SIZE_PX}px`;
      const measuredWidth = word.getBoundingClientRect().width;
      if( measuredWidth === 0 ) {
        word.style.fontSize = "";
        return;
      }
      word.style.fontSize = `${( MEASURE_SIZE_PX * container.clientWidth / measuredWidth ).toFixed( 2 )}px`;
    };

    fit();
    const cancelFontsReady = onFontsReady( fit );
    window.addEventListener( "resize", fit );
    return () => {
      cancelFontsReady();
      window.removeEventListener( "resize", fit );
    };
  }, [ wordRef, text ] );
}
