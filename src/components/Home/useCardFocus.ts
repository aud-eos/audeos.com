import React, { useEffect } from "react";
import styles from "@/styles/Home.module.scss";
import { focusLine, pickFocusedCard } from "@/components/Home/cardFocus";

const MOUSE_QUERY = "(hover: hover) and (pointer: fine)";

// Marks one card in the list as focused, so it shows full color. With a mouse it is the card under
// the pointer, re-checked on scroll because CSS :hover goes stale while the page moves under a
// still cursor. On touch screens it is the card under the focus line. The input type is read live.
export function useCardFocus( listRef: React.RefObject<HTMLUListElement | null> ) {
  useEffect( () => {
    const listOrNull = listRef.current;
    if( !listOrNull ) return;
    const list: HTMLUListElement = listOrNull;

    const mouseQuery = window.matchMedia( MOUSE_QUERY );
    const pointer = { x: 0, y: 0, inside: false };
    let frameHandle = 0;

    function listCards(): HTMLElement[] {
      return Array.from( list.children ).filter( child => child instanceof HTMLElement );
    }

    function hoveredCard(): Element | null {
      if( !pointer.inside ) return null;
      const card = document.elementFromPoint( pointer.x, pointer.y )?.closest( "li" );
      return card && list.contains( card ) ? card : null;
    }

    function centeredCard( cards: HTMLElement[] ): Element | null {
      const line = focusLine({
        viewportHeight: window.innerHeight,
        scrollTop: window.scrollY,
        documentHeight: document.documentElement.scrollHeight,
      });
      const focusedIndex = pickFocusedCard( cards.map( card => card.getBoundingClientRect() ), line );
      return focusedIndex === null ? null : cards[focusedIndex];
    }

    function update() {
      frameHandle = 0;
      const cards = listCards();
      const focused = mouseQuery.matches ? hoveredCard() : centeredCard( cards );
      cards.forEach( card => card.classList.toggle( styles.focused, card === focused ) );
    }

    function scheduleUpdate() {
      if( !frameHandle ) frameHandle = requestAnimationFrame( update );
    }

    function handlePointerMove( event: PointerEvent ) {
      if( event.pointerType !== "mouse" ) return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.inside = true;
      scheduleUpdate();
    }

    function handleMouseOut( event: MouseEvent ) {
      if( event.relatedTarget ) return;
      pointer.inside = false;
      scheduleUpdate();
    }

    document.addEventListener( "pointermove", handlePointerMove, { passive: true });
    document.addEventListener( "mouseout", handleMouseOut );
    window.addEventListener( "scroll", scheduleUpdate, { passive: true });
    window.addEventListener( "resize", scheduleUpdate );
    mouseQuery.addEventListener( "change", scheduleUpdate );
    scheduleUpdate();

    return () => {
      document.removeEventListener( "pointermove", handlePointerMove );
      document.removeEventListener( "mouseout", handleMouseOut );
      window.removeEventListener( "scroll", scheduleUpdate );
      window.removeEventListener( "resize", scheduleUpdate );
      mouseQuery.removeEventListener( "change", scheduleUpdate );
      cancelAnimationFrame( frameHandle );
    };
  }, [ listRef ] );
}
