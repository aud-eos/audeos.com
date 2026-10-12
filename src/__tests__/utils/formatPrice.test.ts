import { describe, it, expect } from "vitest";
import { formatPrice } from "@/utils/formatPrice";

describe( "formatPrice", () => {
  it( "formats whole dollars with a thousands separator and no cents", () => {
    expect( formatPrice( 1200 ) ).toBe( "$1,200" );
    expect( formatPrice( 250 ) ).toBe( "$250" );
  });
});
