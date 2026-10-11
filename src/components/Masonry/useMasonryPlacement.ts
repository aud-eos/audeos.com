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

    let lastWidth = 0;
    let lastHeights: number[] = [];
    let cancelled = false;

    const measureHeights = () => items.map( item => item.getBoundingClientRect().height );

    const layout = () => {
      grid.removeAttribute( PLACED_ATTRIBUTE );
      items.forEach( item => {
        item.style.gridColumn = "";
        item.style.gridRow = "";
      });
      lastWidth = grid.clientWidth;
      lastHeights = measureHeights();
      const columnCount = countColumns( grid );
      if( columnCount < 1 ) return;
      const gap = parseFloat( getComputedStyle( grid ).rowGap ) || 0;
      const heights = lastHeights.map( height => height + gap );
      placeCards( heights, columnCount, ROW_UNIT_PX ).forEach( ( placement, index ) => {
        items[index].style.gridColumn = String( placement.column + 1 );
        items[index].style.gridRow = `${placement.rowStart + 1} / span ${placement.rowSpan}`;
      });
      grid.setAttribute( PLACED_ATTRIBUTE, "" );
    };

    // Compare against the measurements layout() stored, so its own style changes do not retrigger it.
    const layoutIfChanged = () => {
      const currentHeights = measureHeights();
      const heightChanged = currentHeights.some( ( height, index ) => height !== lastHeights[index] );
      if( grid.clientWidth !== lastWidth || heightChanged ) layout();
    };

    layout();
    void document.fonts?.ready.then( () => {
      if( !cancelled ) layout();
    });

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver( layoutIfChanged );
    resizeObserver?.observe( grid );
    items.forEach( item => resizeObserver?.observe( item ) );
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [ gridRef, layoutKey ] );
}
