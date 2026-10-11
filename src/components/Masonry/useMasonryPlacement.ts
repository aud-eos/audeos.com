import { RefObject, useEffect } from "react";
import { placeCards } from "@/components/Masonry/placeCards";

const ROW_UNIT_PX = 1;
const PLACED_ATTRIBUTE = "data-placed";

function supportsNativeMasonry(): boolean {
  return typeof CSS !== "undefined"
    && typeof CSS.supports === "function"
    && CSS.supports( "display", "grid-lanes" );
}

function countColumns( grid: HTMLElement ): number {
  return getComputedStyle( grid ).gridTemplateColumns.split( " " ).filter( Boolean ).length;
}

export function useMasonryPlacement( gridRef: RefObject<HTMLElement | null>, layoutKey: unknown ): void {
  useEffect( () => {
    const grid = gridRef.current;
    if( !grid || supportsNativeMasonry() ) return;

    const items = Array.from( grid.children ).filter(
      ( child ): child is HTMLElement => child instanceof HTMLElement,
    );

    const layout = () => {
      grid.removeAttribute( PLACED_ATTRIBUTE );
      items.forEach( item => {
        item.style.gridColumn = "";
        item.style.gridRow = "";
      });
      const columnCount = countColumns( grid );
      if( columnCount < 1 ) return;
      const gap = parseFloat( getComputedStyle( grid ).rowGap ) || 0;
      const heights = items.map( item => item.getBoundingClientRect().height + gap );
      placeCards( heights, columnCount, ROW_UNIT_PX ).forEach( ( placement, index ) => {
        items[index].style.gridColumn = String( placement.column + 1 );
        items[index].style.gridRow = `${placement.rowStart + 1} / span ${placement.rowSpan}`;
      });
      grid.setAttribute( PLACED_ATTRIBUTE, "" );
    };

    layout();
    void document.fonts?.ready.then( layout );

    let lastWidth = grid.clientWidth;
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver( () => {
      if( grid.clientWidth === lastWidth ) return;
      lastWidth = grid.clientWidth;
      layout();
    });
    resizeObserver?.observe( grid );
    return () => resizeObserver?.disconnect();
  }, [ gridRef, layoutKey ] );
}
