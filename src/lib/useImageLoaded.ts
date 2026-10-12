import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks whether the image inside `containerRef` has loaded, so a placeholder
 * (the hatch) can show until then. An image can finish loading before
 * hydration, so its load event is missed; the mount check covers that case.
 */
export function useImageLoaded<ContainerElement extends HTMLElement>() {
  const containerRef = useRef<ContainerElement>( null );
  const [ loaded, setLoaded ] = useState( false );

  useEffect( () => {
    if( containerRef.current?.querySelector( "img" )?.complete ) setLoaded( true );
  }, [] );

  const markLoaded = useCallback( () => setLoaded( true ), [] );

  return { containerRef, loaded, markLoaded };
}
