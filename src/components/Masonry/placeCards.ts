export interface CardPlacement {
  column: number;
  rowStart: number;
  rowSpan: number;
}

export function placeCards( cardHeights: number[], columnCount: number, rowUnit: number ): CardPlacement[] {
  const columnHeights = Array.from({ length: columnCount }, () => 0 );
  return cardHeights.map( height => {
    const shortest = Math.min( ...columnHeights );
    const column = columnHeights.indexOf( shortest );
    const rowSpan = Math.max( 1, Math.ceil( height / rowUnit ) );
    columnHeights[column] += rowSpan;
    return { column, rowStart: shortest, rowSpan };
  });
}
