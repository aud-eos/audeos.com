const ISO_DATE_PREFIX = /^(\d{4})-(\d{2})-(\d{2})/;

export function formatCardDate( timestamp: string ): string {
  const match = ISO_DATE_PREFIX.exec( timestamp );
  if( !match ) {
    throw new Error( `formatCardDate: "${timestamp}" is not an ISO date` );
  }
  const [ , year, month, day ] = match;
  return `${month}.${day}.${year.slice( 2 )}`;
}
