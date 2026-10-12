import { CategoryId, isCategoryId } from "@/constants";
import { CategoryLanding, getBlogPosts, getCategoryLandings, getHomePages, HomePage } from "@/utils/contentfulUtils";

export type PackageGroup = "dj" | "speakerRental";

export interface PricePackage {
  id: string;
  name: string;
  group: PackageGroup;
  price: number;
  priceOperated: number | null;
  priceUnit: string;
  includes: string[];
}

export interface LandingContent {
  category: CategoryId;
  description: string;
  intro: string | null;
  body: string | null;
  packages: PricePackage[];
  rentalHeading: string | null;
  footnote: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  ogImageUrl: string | null;
}

export type LandingMap = Record<CategoryId, LandingContent>;

export interface HomeContent {
  seoTitle: string;
  seoDescription: string;
  lines: string[];
  showNowPlaying: boolean;
  hireLinkLabel: string;
}

// Plain inputs, so validation is testable without Contentful entry shapes.
export interface PackageInput {
  id: string;
  name: string;
  group: string;
  price: number;
  priceOperated: number | undefined;
  priceUnit: string;
  includes: string[] | undefined;
}

export interface LandingInput {
  category: string;
  description: string;
  intro: string | undefined;
  body: string | undefined;
  packages: PackageInput[];
  rentalHeading: string | undefined;
  footnote: string | undefined;
  ctaLabel: string | undefined;
  ctaUrl: string | undefined;
  ogImageUrl: string | undefined;
}

export interface HomeInput {
  seoTitle: string;
  seoDescription: string;
  lines: string[] | undefined;
  showNowPlaying: boolean;
  hireLinkLabel: string;
}

function isPackageGroup( value: string ): value is PackageGroup {
  return value === "dj" || value === "speakerRental";
}

function toPricePackage( input: PackageInput ): PricePackage {
  if( !isPackageGroup( input.group ) ) {
    throw new Error( `Service package "${input.name}" has unknown group "${input.group}"` );
  }
  if( input.group === "speakerRental" && input.priceOperated === undefined ) {
    throw new Error( `Speaker-rental package "${input.name}" has no "With me" price (priceOperated)` );
  }
  return {
    id: input.id,
    name: input.name,
    group: input.group,
    price: input.price,
    priceOperated: input.priceOperated ?? null,
    priceUnit: input.priceUnit,
    includes: input.includes ?? [],
  };
}

export function buildLandingMap( landings: LandingInput[], postCategories: ( string | undefined )[] ): LandingMap {
  const byCategory = new Map<CategoryId, LandingContent>();
  for( const landing of landings ) {
    if( !isCategoryId( landing.category ) ) {
      throw new Error( `Category landing names unknown category "${landing.category}"` );
    }
    if( ( landing.ctaLabel === undefined ) !== ( landing.ctaUrl === undefined ) ) {
      throw new Error( `Category landing "${landing.category}" needs both a booking link label and URL, or neither` );
    }
    byCategory.set( landing.category, {
      category: landing.category,
      description: landing.description,
      intro: landing.intro ?? null,
      body: landing.body ?? null,
      packages: landing.packages.map( toPricePackage ),
      rentalHeading: landing.rentalHeading ?? null,
      footnote: landing.footnote ?? null,
      ctaLabel: landing.ctaLabel ?? null,
      ctaUrl: landing.ctaUrl ?? null,
      ogImageUrl: landing.ogImageUrl ?? null,
    });
  }
  for( const category of postCategories ) {
    if( category === undefined ) {
      throw new Error( "A published post is missing a category. Make the Contentful field required and backfill it." );
    }
    if( !isCategoryId( category ) || !byCategory.has( category ) ) {
      throw new Error( `Category "${category}" is set on a published post but has no category landing entry` );
    }
  }
  const landingFor = ( categoryId: CategoryId ): LandingContent => {
    const landing = byCategory.get( categoryId );
    if( !landing ) {
      throw new Error( `Category "${categoryId}" has no category landing entry in Contentful` );
    }
    return landing;
  };
  return { music: landingFor( "music" ), events: landingFor( "events" ), lifestyle: landingFor( "lifestyle" ) } satisfies LandingMap;
}

export function buildHomeContent( homes: HomeInput[] ): HomeContent {
  if( homes.length !== 1 ) {
    throw new Error( `Expected exactly one home page entry in Contentful, found ${homes.length}` );
  }
  const [ home ] = homes;
  return { ...home, lines: home.lines ?? [] };
}

function toLandingInput( entry: CategoryLanding ): LandingInput {
  const fields = entry.fields;
  return {
    category: fields.category,
    description: fields.description,
    intro: fields.intro,
    body: fields.body,
    packages: ( fields.packages ?? [] ).flatMap( packageEntry => packageEntry ? [ {
      id: packageEntry.sys.id,
      name: packageEntry.fields.name,
      group: packageEntry.fields.group,
      price: packageEntry.fields.price,
      priceOperated: packageEntry.fields.priceOperated,
      priceUnit: packageEntry.fields.priceUnit,
      includes: packageEntry.fields.includes,
    } ] : [] ),
    rentalHeading: fields.rentalHeading,
    footnote: fields.footnote,
    ctaLabel: fields.ctaLabel,
    ctaUrl: fields.ctaUrl,
    ogImageUrl: fields.ogImage?.fields.file?.url,
  };
}

function toHomeInput( entry: HomePage ): HomeInput {
  const fields = entry.fields;
  return {
    seoTitle: fields.seoTitle,
    seoDescription: fields.seoDescription,
    lines: fields.lines,
    showNowPlaying: fields.showNowPlaying,
    hireLinkLabel: fields.hireLinkLabel,
  };
}

let siteContentPromise: Promise<{ landings: LandingMap; home: HomeContent }> | null = null;

// One validated load per build, shared by every page's getStaticProps.
export function loadSiteContent(): Promise<{ landings: LandingMap; home: HomeContent }> {
  if( !siteContentPromise ) {
    siteContentPromise = Promise.all( [ getBlogPosts(), getCategoryLandings(), getHomePages() ] )
      .then( ( [ posts, landingEntries, homeEntries ] ) => ({
        landings: buildLandingMap( landingEntries.items.map( toLandingInput ), posts.items.map( post => post.fields.category ) ),
        home: buildHomeContent( homeEntries.items.map( toHomeInput ) ),
      }) );
  }
  return siteContentPromise;
}
