import { useEffect } from "react";
import { useRouter } from "next/router";

interface RouteChangeOptions {
  shallow?: boolean;
}

/**
 * Wraps each page navigation in a View Transition so the shared `giant-word`
 * element morphs between pages. The transition is held open until Next.js
 * reports the new route as rendered (or failed). Unsupported browsers and
 * reduced-motion users get a normal route change.
 */
export function useRouteViewTransition(): void {
  const router = useRouter();

  useEffect( () => {
    if( !( "startViewTransition" in document ) ) return;

    let finishTransition: ( () => void ) | null = null;

    const settle = () => {
      finishTransition?.();
      finishTransition = null;
    };

    const handleStart = ( _url: string, options?: RouteChangeOptions ) => {
      if( options?.shallow ) return;
      if( window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches ) return;
      settle();
      // The browser runs the update callback on a later frame, so the held
      // promise and its resolver must exist before the route can finish.
      const held = new Promise<void>( resolve => {
        finishTransition = resolve;
      });
      const transition = document.startViewTransition( () => held );
      transition.ready.catch( ( error: unknown ) => {
        // A skipped transition rejects `ready` with an AbortError; anything else is real.
        if( !( error instanceof DOMException && error.name === "AbortError" ) ) throw error;
      });
    };

    router.events.on( "routeChangeStart", handleStart );
    router.events.on( "routeChangeComplete", settle );
    router.events.on( "routeChangeError", settle );
    return () => {
      router.events.off( "routeChangeStart", handleStart );
      router.events.off( "routeChangeComplete", settle );
      router.events.off( "routeChangeError", settle );
      settle();
    };
  }, [ router.events ] );
}
