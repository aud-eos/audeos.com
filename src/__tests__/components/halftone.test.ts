import { describe, it, expect } from "vitest";
import {
  HALFTONE_PITCH,
  adjustedLuminance,
  halftoneDots,
  sampleSize,
  tintForCard,
} from "@/components/Home/halftone";

const CARD_WIDTH = 400;
const CARD_HEIGHT = 300;

function uniformGrid( value: number ) {
  const { columns, rows } = sampleSize( CARD_WIDTH, CARD_HEIGHT );
  return { values: new Float32Array( columns * rows ).fill( value ), columns, rows };
}

describe( "tintForCard", () => {
  it( "cycles the seven colors in order", () => {
    expect( tintForCard( 0 ) ).toBe( "#90ee90" );
    expect( tintForCard( 6 ) ).toBe( "#ffffff" );
    expect( tintForCard( 7 ) ).toBe( "#90ee90" );
  });

  it( "gives the second and third home sections blue and orange", () => {
    expect( tintForCard( 12 ) ).toBe( "#5b8cff" );
    expect( tintForCard( 24 ) ).toBe( "#ff7a2f" );
  });
});

describe( "adjustedLuminance", () => {
  it( "keeps mid gray, clamps darks to black and stretches contrast by 3", () => {
    expect( adjustedLuminance( 127.5, 127.5, 127.5 ) ).toBeCloseTo( 0.5 );
    expect( adjustedLuminance( 51, 51, 51 ) ).toBe( 0 );
    expect( adjustedLuminance( 153, 153, 153 ) ).toBeCloseTo( 0.8 );
    expect( adjustedLuminance( 255, 255, 255 ) ).toBe( 1 );
  });

  it( "weights channels by Rec. 709 without linearizing", () => {
    expect( adjustedLuminance( 0, 153, 0 ) ).toBeCloseTo( ( 0.7152 * 0.6 - 0.5 ) * 3 + 0.5 );
  });
});

describe( "halftoneDots", () => {
  it( "draws nothing for a black image", () => {
    expect( halftoneDots( uniformGrid( 0 ), CARD_WIDTH, CARD_HEIGHT ) ).toEqual( [] );
  });

  it( "draws full-size dots covering the card for a white image", () => {
    const dots = halftoneDots( uniformGrid( 1 ), CARD_WIDTH, CARD_HEIGHT );
    const fullRadius = HALFTONE_PITCH * 0.5 * Math.SQRT2;
    expect( dots.every( dot => dot.radius === fullRadius ) ).toBe( true );
    // A 45° grid at a 4px pitch has one dot per 16 px², plus a one-pitch margin around the card.
    expect( dots.length ).toBeGreaterThan( ( CARD_WIDTH * CARD_HEIGHT ) / 16 );
  });

  it( "sizes dot area by brightness", () => {
    const [ quarterDot ] = halftoneDots( uniformGrid( 0.25 ), CARD_WIDTH, CARD_HEIGHT );
    const [ fullDot ] = halftoneDots( uniformGrid( 1 ), CARD_WIDTH, CARD_HEIGHT );
    expect( ( quarterDot.radius / fullDot.radius ) ** 2 ).toBeCloseTo( 0.25 );
  });

  it( "rotates the grid 45° about the card's center", () => {
    const dots = halftoneDots( uniformGrid( 1 ), CARD_WIDTH, CARD_HEIGHT );
    const diagonalStep = HALFTONE_PITCH * Math.SQRT1_2;
    const hasDotAt = ( targetX: number, targetY: number ) =>
      dots.some( dot => Math.abs( dot.x - targetX ) < 1e-9 && Math.abs( dot.y - targetY ) < 1e-9 );
    expect( hasDotAt( CARD_WIDTH / 2, CARD_HEIGHT / 2 ) ).toBe( true );
    expect( hasDotAt( CARD_WIDTH / 2 + diagonalStep, CARD_HEIGHT / 2 + diagonalStep ) ).toBe( true );
  });
});
