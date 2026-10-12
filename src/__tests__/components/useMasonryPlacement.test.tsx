import { describe, it, expect, vi, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { useRef } from "react";
import { useMasonryPlacement } from "@/components/Masonry/useMasonryPlacement";

function Grid() {
  const gridRef = useRef<HTMLUListElement>( null );
  useMasonryPlacement( gridRef, "key" );
  return (
    <ul ref={ gridRef } data-testid="grid">
      <li>one</li>
      <li>two</li>
    </ul>
  );
}

afterEach( () => {
  vi.unstubAllGlobals();
});

describe( "useMasonryPlacement", () => {
  it( "leaves layout to the browser when native masonry is supported", () => {
    vi.stubGlobal( "CSS", { supports: ( property: string, value: string ) => property === "display" && value === "grid-lanes" });
    const { getByTestId } = render( <Grid /> );
    const grid = getByTestId( "grid" );
    expect( grid.hasAttribute( "data-placed" ) ).toBe( false );
    grid.querySelectorAll( "li" ).forEach( item => {
      expect( item.style.gridColumn ).toBe( "" );
      expect( item.style.gridRow ).toBe( "" );
    });
  });
});
