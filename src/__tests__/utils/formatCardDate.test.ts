import { describe, it, expect } from "vitest";
import { formatCardDate } from "@/utils/formatCardDate";

describe( "formatCardDate", () => {
  it( "formats a Contentful date as MM.DD.YY", () => {
    expect( formatCardDate( "2026-06-11" ) ).toBe( "06.11.26" );
  });

  it( "keeps the calendar date of a UTC timestamp regardless of the viewer's timezone", () => {
    expect( formatCardDate( "2026-01-05T23:30:00Z" ) ).toBe( "01.05.26" );
  });

  it( "fails loudly on a value that is not an ISO date", () => {
    expect( () => formatCardDate( "June 11" ) ).toThrow( /June 11/ );
  });
});
