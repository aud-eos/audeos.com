import { describe, it, expect } from "vitest";
import { placeCards } from "@/components/Masonry/placeCards";

describe( "placeCards", () => {
  it( "puts the first cards across the top row, left to right", () => {
    const placements = placeCards( [ 300, 200, 250 ], 3, 1 );
    expect( placements.map( placement => [ placement.column, placement.rowStart ] ) )
      .toEqual( [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ] ] );
  });

  it( "sends each later card to the currently shortest column", () => {
    const placements = placeCards( [ 300, 200, 250, 100, 100 ], 3, 1 );
    expect( placements[3] ).toEqual({ column: 1, rowStart: 200, rowSpan: 100 });
    expect( placements[4] ).toEqual({ column: 2, rowStart: 250, rowSpan: 100 });
  });

  it( "breaks ties toward the leftmost column", () => {
    const placements = placeCards( [ 100, 100, 100 ], 2, 1 );
    expect( placements[2].column ).toBe( 0 );
  });

  it( "rounds spans up to whole row units", () => {
    expect( placeCards( [ 95 ], 1, 10 )[0].rowSpan ).toBe( 10 );
  });
});
