import { adjustedLuminance, halftoneDots, sampleSize, type LuminanceGrid } from "@/components/Home/halftone";

// Dots smaller than this many device pixels would only add faint specks.
const MIN_DOT_RADIUS_DEVICE_PX = 0.3;

function context2d( canvas: HTMLCanvasElement, options?: CanvasRenderingContext2DSettings ): CanvasRenderingContext2D {
  const context = canvas.getContext( "2d", options );
  if( !context ) throw new Error( "Halftone canvas has no 2D context" );
  return context;
}

// Cover-fits the image into a small canvas and reads its contrast-adjusted luminance.
function sampleLuminance( image: HTMLImageElement, width: number, height: number ): LuminanceGrid {
  const { columns, rows } = sampleSize( width, height );
  const sampler = document.createElement( "canvas" );
  sampler.width = columns;
  sampler.height = rows;
  const context = context2d( sampler, { willReadFrequently: true });
  context.imageSmoothingQuality = "high";
  const scale = Math.max( columns / image.naturalWidth, rows / image.naturalHeight );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage( image, ( columns - drawWidth ) / 2, ( rows - drawHeight ) / 2, drawWidth, drawHeight );
  const pixels = context.getImageData( 0, 0, columns, rows ).data;
  const values = new Float32Array( columns * rows );
  for( let index = 0; index < values.length; index++ ) {
    const offset = index * 4;
    values[index] = adjustedLuminance( pixels[offset], pixels[offset + 1], pixels[offset + 2] );
  }
  return { values, columns, rows };
}

// Draws the image's halftone in `tint` on black at the device's pixel ratio. Throws if the canvas
// can't be drawn (no 2D context, or an image served without CORS taints the canvas).
export function drawHalftone( canvas: HTMLCanvasElement, image: HTMLImageElement, tint: string ): void {
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;
  if( !width || !height ) return;
  const ratio = window.devicePixelRatio || 1;
  const dots = halftoneDots( sampleLuminance( image, width, height ), width, height );

  canvas.width = Math.round( width * ratio );
  canvas.height = Math.round( height * ratio );
  const context = context2d( canvas );
  context.fillStyle = "#000";
  context.fillRect( 0, 0, canvas.width, canvas.height );
  context.fillStyle = tint;
  context.beginPath();
  for( const dot of dots ) {
    const radius = dot.radius * ratio;
    if( radius < MIN_DOT_RADIUS_DEVICE_PX ) continue;
    context.moveTo( dot.x * ratio + radius, dot.y * ratio );
    context.arc( dot.x * ratio, dot.y * ratio, radius, 0, Math.PI * 2 );
  }
  context.fill();
}
