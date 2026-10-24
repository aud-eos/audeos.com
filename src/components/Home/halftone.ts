// Halftone for resting post-grid cards: round dots on a 45° grid, sized by the contrast-boosted
// brightness under each dot and drawn in one color per card.

export const HALFTONE_PITCH = 4;
const HALFTONE_CONTRAST = 3;
// Sample twice per dot pitch; the browser's downscale averages the pixels in between.
const SAMPLES_PER_PITCH = 2;
const FULL_DOT_RADIUS = HALFTONE_PITCH * 0.5 * Math.SQRT2;

export const HALFTONE_TINTS: readonly string[] = [
  "#90ee90",
  "#8ef0f7",
  "#d4ff3a",
  "#ff7a2f",
  "#ff5fa8",
  "#5b8cff",
  "#ffffff",
];

export interface LuminanceGrid { values: Float32Array; columns: number; rows: number }
export interface HalftoneDot { x: number; y: number; radius: number }

export function tintForCard( cardIndex: number ): string {
  return HALFTONE_TINTS[cardIndex % HALFTONE_TINTS.length];
}

function clampUnit( value: number ): number {
  return Math.min( 1, Math.max( 0, value ) );
}

// Rec. 709 weights on the gamma-encoded bytes (no linearizing), then contrast about mid gray.
export function adjustedLuminance( red: number, green: number, blue: number ): number {
  const luminance = ( 0.2126 * red + 0.7152 * green + 0.0722 * blue ) / 255;
  return clampUnit( ( luminance - 0.5 ) * HALFTONE_CONTRAST + 0.5 );
}

export function sampleSize( width: number, height: number ): { columns: number; rows: number } {
  return {
    columns: Math.ceil( width / HALFTONE_PITCH * SAMPLES_PER_PITCH ),
    rows: Math.ceil( height / HALFTONE_PITCH * SAMPLES_PER_PITCH ),
  };
}

function nearestIndex( position: number, extent: number, count: number ): number {
  return Math.min( count - 1, Math.max( 0, Math.floor( position / extent * count ) ) );
}

// Walks a grid rotated 45° about the card's center, keeping points up to one pitch outside the card.
export function halftoneDots( grid: LuminanceGrid, width: number, height: number ): HalftoneDot[] {
  const steps = Math.ceil( Math.hypot( width, height ) / HALFTONE_PITCH );
  const dots: HalftoneDot[] = [];
  for( let stepY = -steps; stepY <= steps; stepY++ ) {
    for( let stepX = -steps; stepX <= steps; stepX++ ) {
      const gridX = stepX * HALFTONE_PITCH;
      const gridY = stepY * HALFTONE_PITCH;
      const x = width / 2 + ( gridX - gridY ) * Math.SQRT1_2;
      const y = height / 2 + ( gridX + gridY ) * Math.SQRT1_2;
      if( x < -HALFTONE_PITCH || y < -HALFTONE_PITCH || x > width + HALFTONE_PITCH || y > height + HALFTONE_PITCH ) continue;
      const column = nearestIndex( x, width, grid.columns );
      const row = nearestIndex( y, height, grid.rows );
      const radius = FULL_DOT_RADIUS * Math.sqrt( grid.values[row * grid.columns + column] );
      if( radius > 0 ) dots.push({ x, y, radius });
    }
  }
  return dots;
}
