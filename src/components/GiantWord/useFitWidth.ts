import { RefObject, useEffect } from "react";
import { onFontsReady } from "@/utils/onFontsReady";

export const PHONE_QUERY = "(max-width: 699px)";
// Desktop words are sized to this multiple of the container so every word runs off the right edge by the same amount.
export const DESKTOP_OVERSHOOT = 1.15;
const MEASURE_SIZE_PX = 100;

export function useFitWidth( wordRef: RefObject<HTMLElement | null>, text: string ): void {
  useEffect( () => {
    const word = wordRef.current;
    const container = word?.parentElement;
    if( !word || !container ) return;
    const phoneQuery = window.matchMedia( PHONE_QUERY );

    const fit = () => {
      word.style.fontSize = `${MEASURE_SIZE_PX}px`;
      const measuredWidth = word.getBoundingClientRect().width;
      if( measuredWidth === 0 ) {
        word.style.fontSize = "";
        return;
      }
      const targetWidth = container.clientWidth * ( phoneQuery.matches ? 1 : DESKTOP_OVERSHOOT );
      word.style.fontSize = `${( MEASURE_SIZE_PX * targetWidth / measuredWidth ).toFixed( 2 )}px`;
    };

    fit();
    const cancelFontsReady = onFontsReady( fit );
    phoneQuery.addEventListener( "change", fit );
    window.addEventListener( "resize", fit );
    return () => {
      cancelFontsReady();
      phoneQuery.removeEventListener( "change", fit );
      window.removeEventListener( "resize", fit );
    };
  }, [ wordRef, text ] );
}
