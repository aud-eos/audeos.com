import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import GiantWord from "@/components/GiantWord/GiantWord";

beforeEach( () => {
  vi.stubGlobal( "matchMedia", ( query: string ) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) );
});

describe( "GiantWord", () => {
  it( "renders the page heading as real text", () => {
    render( <GiantWord text="Events" /> );
    expect( screen.getByRole( "heading", { level: 1, name: "Events" }) ).toBeInTheDocument();
  });

  it( "labels the phone logo so the stacked mark still reads as Audeos", () => {
    render( <GiantWord text="Audeos" stackedLogoOnPhone /> );
    expect( screen.getByRole( "img", { name: "Audeos" }) ).toBeInTheDocument();
  });
});
