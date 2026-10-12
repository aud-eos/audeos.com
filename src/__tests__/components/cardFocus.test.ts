import { describe, it, expect } from "vitest";
import { focusLine, pickFocusedCard } from "@/components/Home/cardFocus";

const VIEWPORT_HEIGHT = 800;

describe( "focusLine", () => {
  it( "sits at the middle of the screen away from the ends of the page", () => {
    expect( focusLine({ viewportHeight: VIEWPORT_HEIGHT, scrollTop: 2000, documentHeight: 6000 }) ).toBe( 400 );
  });

  it( "slides toward the top edge at the top of the page and the bottom edge at the bottom", () => {
    const atTop = focusLine({ viewportHeight: VIEWPORT_HEIGHT, scrollTop: 0, documentHeight: 6000 });
    const atBottom = focusLine({ viewportHeight: VIEWPORT_HEIGHT, scrollTop: 5200, documentHeight: 6000 });
    expect( atTop ).toBeLessThan( VIEWPORT_HEIGHT / 4 );
    expect( atBottom ).toBeGreaterThan( VIEWPORT_HEIGHT * 3 / 4 );
  });
});

describe( "pickFocusedCard", () => {
  // One row of three cards, listed out of order so the sweep must sort by position.
  const row = [
    { top: 0, bottom: 300, left: 800 },
    { top: 0, bottom: 300, left: 0 },
    { top: 0, bottom: 300, left: 400 },
  ];

  it( "sweeps across a row left to right as the line moves down through it", () => {
    expect( pickFocusedCard( row, 50 ) ).toBe( 1 );
    expect( pickFocusedCard( row, 150 ) ).toBe( 2 );
    expect( pickFocusedCard( row, 250 ) ).toBe( 0 );
  });

  it( "focuses nothing when the line is outside every card", () => {
    expect( pickFocusedCard( row, 300 ) ).toBeNull();
    expect( pickFocusedCard( row, -10 ) ).toBeNull();
  });

  it( "focuses the card under the line in a single column", () => {
    const column = [
      { top: 0, bottom: 300, left: 0 },
      { top: 300, bottom: 600, left: 0 },
    ];
    expect( pickFocusedCard( column, 450 ) ).toBe( 1 );
  });
});
