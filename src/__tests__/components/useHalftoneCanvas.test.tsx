import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render } from "@testing-library/react";
import { useRef } from "react";

const { drawHalftone } = vi.hoisted( () => ({
  drawHalftone: vi.fn( ( canvas: HTMLCanvasElement ) => {
    canvas.width = 120;
    canvas.height = 90;
  }),
}) );
vi.mock( "@/components/Home/drawHalftone", () => ({ drawHalftone }) );

import { useHalftoneCanvas } from "@/components/Home/useHalftoneCanvas";

let reportNear: ( isNear: boolean ) => void = () => {};
let reportResize: () => void = () => {};

function HalftoneCard() {
  const containerRef = useRef<HTMLDivElement>( null );
  const canvasRef = useHalftoneCanvas( containerRef, "#90ee90" );
  return (
    <div ref={ containerRef }>
      <img alt="" />
      <canvas ref={ canvasRef } />
    </div>
  );
}

function renderLoadedCard() {
  const view = render( <HalftoneCard /> );
  const image = view.container.querySelector( "img" );
  const canvas = view.container.querySelector( "canvas" );
  if( !image || !canvas ) throw new Error( "card did not render" );
  Object.defineProperty( image, "complete", { value: true });
  Object.defineProperty( image, "naturalWidth", { value: 800 });
  return { canvas };
}

function nextFrames() {
  act( () => { vi.runAllTimers(); });
}

beforeEach( () => {
  vi.useFakeTimers();
  drawHalftone.mockClear();
  vi.stubGlobal( "requestAnimationFrame", ( callback: FrameRequestCallback ) => setTimeout( () => callback( 0 ), 16 ) );
  vi.stubGlobal( "IntersectionObserver", vi.fn( function( callback: ( entries: { isIntersecting: boolean }[] ) => void ) {
    reportNear = isNear => callback( [ { isIntersecting: isNear } ] );
    return { observe: vi.fn(), disconnect: vi.fn() };
  }) );
  vi.stubGlobal( "ResizeObserver", vi.fn( function( callback: () => void ) {
    reportResize = callback;
    return { observe: vi.fn(), disconnect: vi.fn() };
  }) );
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

afterEach( () => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe( "useHalftoneCanvas", () => {
  it( "releases a drawn canvas when its card leaves the near zone, and redraws on return", () => {
    const { canvas } = renderLoadedCard();
    reportNear( true );
    nextFrames();
    expect( canvas.width ).toBe( 120 );

    reportNear( false );
    expect( canvas.width ).toBe( 0 );
    expect( canvas.height ).toBe( 0 );

    reportNear( true );
    nextFrames();
    expect( drawHalftone ).toHaveBeenCalledTimes( 2 );
  });

  it( "skips a queued draw for a card that left the near zone before its turn", () => {
    renderLoadedCard();
    reportNear( true );
    reportNear( false );
    nextFrames();
    expect( drawHalftone ).not.toHaveBeenCalled();
  });

  it( "clears the old bitmap as soon as the card resizes, instead of showing it stretched", () => {
    const { canvas } = renderLoadedCard();
    reportNear( true );
    nextFrames();

    reportResize();
    expect( canvas.width ).toBe( 0 );
    nextFrames();
    expect( canvas.width ).toBe( 120 );
  });
});
