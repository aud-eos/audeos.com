import { useEffect } from "react";
import { useRouter } from "next/router";

interface RouteChangeOptions {
  shallow?: boolean;
}

/**
 * Wraps each page navigation in a View Transition so the shared `giant-word`
 * element morphs between pages. The transition is held open until Next.js
 * reports the new route as rendered (or failed). Navigation is never blocked:
 * unsupported browsers, reduced-motion users and transition errors all fall
 * back to a normal route change.
 */
export function useRouteViewTransition(): void {
  const router = useRouter();

  useEffect( () => {
    if( !( "startViewTransition" in document ) ) return;
    if( window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches ) return;

    let finishTransition: ( () => void ) | null = null;

    const settle = () => {
      finishTransition?.();
      finishTransition = null;
    };

    const handleStart = ( _url: string, options?: RouteChangeOptions ) => {
      if( options?.shallow ) return;
      settle();
      try {
        const transition = document.startViewTransition( () => new Promise<void>( resolve => {
          finishTransition = resolve;
        }) );
        // A skipped transition rejects these promises; that is not an error for us.
        transition?.ready?.catch( () => undefined );
        transition?.finished?.catch( () => undefined );
      } catch {
        settle();
      }
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
