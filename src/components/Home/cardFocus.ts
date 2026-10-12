// How far the focus line slides from the middle toward an edge, as a fraction of the screen height.
const FOCUS_EDGE_SLIDE = 0.35;

export interface ScrollState {
  viewportHeight: number
  scrollTop: number
  documentHeight: number
}

export interface CardBounds {
  top: number
  bottom: number
  left: number
}

// The line (in viewport coordinates) that picks the focused card on touch screens. It sits at the
// middle of the screen, but slides toward the top or bottom edge over the first and last
// half-screen of scrolling, so the first and last rows still reach it.
export function focusLine({ viewportHeight, scrollTop, documentHeight }: ScrollState ): number {
  const half = Math.max( 1, viewportHeight / 2 );
  const slackAbove = Math.max( 0, scrollTop );
  const slackBelow = Math.max( 0, documentHeight - scrollTop - viewportHeight );
  const towardTop = 1 - Math.min( 1, slackAbove / half );
  const towardBottom = 1 - Math.min( 1, slackBelow / half );
  return viewportHeight * ( 0.5 + FOCUS_EDGE_SLIDE * ( towardBottom - towardTop ) );
}

// The index of the card the line falls in, or null. In a row of several cards, the line's progress
// down the row picks the column, so focus sweeps across the row left to right.
export function pickFocusedCard( cards: readonly CardBounds[], line: number ): number | null {
  const rowIndexes = cards
    .map( ( _card, cardIndex ) => cardIndex )
    .filter( cardIndex => cards[cardIndex].top <= line && line < cards[cardIndex].bottom )
    .sort( ( first, second ) => cards[first].left - cards[second].left );
  if( rowIndexes.length === 0 ) return null;
  const { top, bottom } = cards[rowIndexes[0]];
  const progress = ( line - top ) / ( bottom - top );
  return rowIndexes[Math.min( rowIndexes.length - 1, Math.floor( progress * rowIndexes.length ) )];
}
