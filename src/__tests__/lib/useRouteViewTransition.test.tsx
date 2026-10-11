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

function fakeTransition(): ViewTransition {
  return {
    ready: Promise.resolve(),
    finished: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: () => undefined,
    types: new Set<string>(),
  };
}

function stubStartViewTransition( onStart: ( update: () => Promise<void> ) => void ) {
  const startViewTransition = vi.fn( ( update?: ViewTransitionUpdateCallback ) => {
    if( update ) onStart( update );
    return fakeTransition();
  });
  Object.defineProperty( document, "startViewTransition", {
    configurable: true,
    value: startViewTransition,
  });
  return startViewTransition;
}

describe( "useRouteViewTransition", () => {
  it( "releases the transition even when the route finishes before the browser runs the update callback", async () => {
    let runUpdate: () => Promise<void> = () => Promise.resolve();
    stubStartViewTransition( update => { runUpdate = update; });
    render( <Harness /> );

    handlers.get( "routeChangeStart" )?.( "/category/music", { shallow: false });
    handlers.get( "routeChangeComplete" )?.( "/category/music" );

    let settled = false;
    void runUpdate().then( () => { settled = true; });
    await Promise.resolve();
    await Promise.resolve();
    expect( settled ).toBe( true );
  });

  it( "holds the transition open until the new route has rendered", async () => {
    let updateDone: Promise<void> = Promise.resolve();
    stubStartViewTransition( update => { updateDone = update(); });
    render( <Harness /> );

    handlers.get( "routeChangeStart" )?.( "/category/music", { shallow: false });
    let settled = false;
    void updateDone.then( () => { settled = true; });
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

  it( "skips the transition when the user prefers reduced motion", () => {
    const startViewTransition = stubStartViewTransition( () => undefined );
    vi.stubGlobal( "matchMedia", ( query: string ) => ({ matches: true, media: query }) );
    render( <Harness /> );
    handlers.get( "routeChangeStart" )?.( "/search", { shallow: false });
    expect( startViewTransition ).not.toHaveBeenCalled();
  });
});
