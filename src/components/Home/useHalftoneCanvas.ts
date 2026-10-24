import React, { useEffect, useRef } from "react";
import { drawHalftone } from "@/components/Home/drawHalftone";

// Cards within one screen of the viewport get drawn ahead of being scrolled to.
const NEAR_SCREEN_MARGIN = "100% 0px";

// One queue for every card on the page, drained one draw per animation frame so no single task
// blocks the main thread for long.
const pendingDraws = new Set<() => void>();
let drainFrame = 0;

function drainOne() {
  drainFrame = 0;
  const [ nextDraw ] = pendingDraws;
  if( !nextDraw ) return;
  pendingDraws.delete( nextDraw );
  if( pendingDraws.size ) drainFrame = requestAnimationFrame( drainOne );
  nextDraw();
}

function enqueueDraw( draw: () => void ) {
  pendingDraws.add( draw );
  if( !drainFrame ) drainFrame = requestAnimationFrame( drainOne );
}

// Draws the halftone of the image inside `containerRef` onto the returned canvas once the card is
// near the screen and its image has loaded, and redraws when the canvas resizes or the device pixel
// ratio changes.
export function useHalftoneCanvas(
  containerRef: React.RefObject<HTMLElement | null>,
  tint: string,
): React.RefObject<HTMLCanvasElement | null> {
  const canvasRef = useRef<HTMLCanvasElement>( null );

  useEffect( () => {
    const canvas = canvasRef.current;
    const image = containerRef.current?.querySelector( "img" );
    if( !canvas || !image ) return;

    let near = false;
    let stale = true;

    function draw() {
      if( !canvas || !image ) return;
      drawHalftone( canvas, image, tint );
      stale = false;
    }

    function requestDraw() {
      if( near && stale && image?.complete && image.naturalWidth ) enqueueDraw( draw );
    }

    function markStale() {
      stale = true;
      requestDraw();
    }

    const nearObserver = new IntersectionObserver( entries => {
      near = entries.some( entry => entry.isIntersecting );
      requestDraw();
    }, { rootMargin: NEAR_SCREEN_MARGIN });
    nearObserver.observe( canvas );

    const resizeObserver = new ResizeObserver( markStale );
    resizeObserver.observe( canvas );

    let ratioQuery = window.matchMedia( `(resolution: ${window.devicePixelRatio}dppx)` );
    function handleRatioChange() {
      ratioQuery.removeEventListener( "change", handleRatioChange );
      ratioQuery = window.matchMedia( `(resolution: ${window.devicePixelRatio}dppx)` );
      ratioQuery.addEventListener( "change", handleRatioChange );
      markStale();
    }
    ratioQuery.addEventListener( "change", handleRatioChange );

    image.addEventListener( "load", markStale );
    requestDraw();

    return () => {
      nearObserver.disconnect();
      resizeObserver.disconnect();
      ratioQuery.removeEventListener( "change", handleRatioChange );
      image.removeEventListener( "load", markStale );
      pendingDraws.delete( draw );
    };
  }, [ containerRef, tint ] );

  return canvasRef;
}
