import { Mona_Sans } from "next/font/google";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import * as gtag from "../lib/google-analytics";
import { GoogleAnalytics } from "@/lib/GoogleAnalytics";
import CookieConsent from "@/components/CookieConsent";

const fontMonaSans = Mona_Sans({
  subsets: [ "latin" ],
  axes: [ "wdth" ],
  variable: "--font-mona-sans",
});

export default function App({ Component, pageProps }: AppProps ) {

  const router = useRouter();

  /** Google Analytics Effect */
  useEffect( () => {
    const handleRouteChange = ( url: string ) => gtag.trackPageview( url );
    router.events.on( "routeChangeComplete", handleRouteChange );
    return () => router.events.off( "routeChangeComplete", handleRouteChange );
  }, [ router.events ] );

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="view-transition" content="same-origin" />
      </Head>
      <CookieConsent />
      <GoogleAnalytics />
      <div className={ `${fontMonaSans.className} ${fontMonaSans.variable}` }>
        <Component { ...pageProps } />
      </div>
    </>
  );
}
