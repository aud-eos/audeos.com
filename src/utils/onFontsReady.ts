/** Runs `callback` once web fonts have loaded; the returned function cancels it. */
export function onFontsReady( callback: () => void ): () => void {
  let cancelled = false;
  void document.fonts?.ready.then( () => {
    if( !cancelled ) callback();
  });
  return () => {
    cancelled = true;
  };
}
