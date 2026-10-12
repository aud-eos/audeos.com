import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import PriceList from "@/components/Landing/PriceList";
import { PricePackage } from "@/lib/siteContent";

const pair: PricePackage = {
  id: "pkg-pair", name: "Pair", group: "speakerRental", price: 250, priceOperated: 600, priceUnit: "per day", includes: [ "2× K12, stands", "2 Shure SM58" ],
};
const party: PricePackage = {
  id: "pkg-party", name: "Party / club night", group: "dj", price: 1200, priceOperated: null, priceUnit: "per event", includes: [ "Up to 4 hrs" ],
};

describe( "PriceList", () => {
  it( "shows the Gear only and With me prices on a rental row", () => {
    render( <PriceList packages={ [ pair ] } showOperatedPrice /> );
    const row = screen.getAllByRole( "listitem" )[ 0 ];
    expect( within( row ).getByText( "Gear only" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "$250" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "With me" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "$600" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "2 Shure SM58" ) ).toBeInTheDocument();
  });

  it( "shows one price and its unit on a DJ row", () => {
    render( <PriceList packages={ [ party ] } showOperatedPrice={ false } /> );
    const row = screen.getAllByRole( "listitem" )[ 0 ];
    expect( within( row ).getByText( "$1,200" ) ).toBeInTheDocument();
    expect( within( row ).getByText( "per event" ) ).toBeInTheDocument();
    expect( within( row ).queryByText( "With me" ) ).toBeNull();
  });
});
