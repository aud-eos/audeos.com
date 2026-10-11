import { RefObject, useEffect } from "react";

export const PHONE_QUERY = "(max-width: 699px)";
const MEASURE_SIZE_PX = 100;

export function useFitWidth( wordRef: RefObject<HTMLElement | null>, text: string ): void {
  useEffect( () => {
    const word = wordRef.current;
    const container = word?.parentElement;
    if( !word || !container ) return;
    const phoneQuery = window.matchMedia( PHONE_QUERY );

    const fit = () => {
      if( !phoneQuery.matches ) {
        word.style.fontSize = "";
        return;
      }
      word.style.fontSize = `${MEASURE_SIZE_PX}px`;
      const measuredWidth = word.getBoundingClientRect().width;
      if( measuredWidth === 0 ) return;
      word.style.fontSize = `${( MEASURE_SIZE_PX * container.clientWidth / measuredWidth ).toFixed( 2 )}px`;
    };

    fit();
    void document.fonts?.ready.then( fit );
    phoneQuery.addEventListener( "change", fit );
    window.addEventListener( "resize", fit );
    return () => {
      phoneQuery.removeEventListener( "change", fit );
      window.removeEventListener( "resize", fit );
    };
  }, [ wordRef, text ] );
}
