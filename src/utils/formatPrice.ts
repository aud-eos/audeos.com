const DOLLARS = new Intl.NumberFormat( "en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatPrice( dollars: number ): string {
  return DOLLARS.format( dollars );
}
