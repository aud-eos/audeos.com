import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

type Handler = ( ...args: unknown[] ) => void;
const handlers = new Map<string, Handler>();

vi.mock( "next/router", () => ({
  useRouter: () => ({
    events: {
      on: ( event: string, handler: Handler ) => handlers.set( event, handler ),
      off: ( event: string ) => handlers.delete( event ),
    },
  }),
}) );

import { useRouteViewTransition } from "@/lib/useRouteViewTransition";

function Harness() {
  useRouteViewTransition();
  return null;
}

beforeEach( () => {
  handlers.clear();
  vi.stubGlobal( "matchMedia", ( query: string ) => ({ matches: false, media: query }) );
});

afterEach( () => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty( document, "startViewTransition" );
});

describe( "useRouteViewTransition", () => {
  it( "holds the transition open until the new route has rendered", async () => {
    let updateDone: Promise<void> | undefined;
    Object.defineProperty( document, "startViewTransition", {
      configurable: true,
      value: ( update: () => Promise<void> ) => { updateDone = update(); },
    });
    render( <Harness /> );

    handlers.get( "routeChangeStart" )?.( "/category/music", { shallow: false });
    let settled = false;
    void updateDone?.then( () => { settled = true; });
    await Promise.resolve();
    expect( settled ).toBe( false );

    handlers.get( "routeChangeComplete" )?.( "/category/music" );
    await updateDone;
    expect( settled ).toBe( true );
  });

  it( "does nothing in browsers without view transitions", () => {
    render( <Harness /> );
    expect( handlers.size ).toBe( 0 );
  });

  it( "does nothing when the user prefers reduced motion", () => {
    Object.defineProperty( document, "startViewTransition", {
      configurable: true,
      value: vi.fn(),
    });
    vi.stubGlobal( "matchMedia", ( query: string ) => ({ matches: true, media: query }) );
    render( <Harness /> );
    expect( handlers.size ).toBe( 0 );
  });

  it( "lets navigation proceed when starting the transition throws", () => {
    Object.defineProperty( document, "startViewTransition", {
      configurable: true,
      value: () => { throw new Error( "transition unavailable" ); },
    });
    render( <Harness /> );
    expect( () => handlers.get( "routeChangeStart" )?.( "/search", { shallow: false }) ).not.toThrow();
  });
});
