import { describe, it, expect } from "vitest";
import { categoryTitleFor } from "@/utils/categoryTitle";

describe( "categoryTitleFor", () => {
  it( "returns the configured title for a category", () => {
    expect( categoryTitleFor( "events" ) ).toBe( "Events" );
  });

  it( "fails loudly for a category with no config", () => {
    expect( () => categoryTitleFor( "podcasts" ) ).toThrow( /podcasts/ );
    expect( () => categoryTitleFor( undefined ) ).toThrow( /undefined/ );
  });
});
