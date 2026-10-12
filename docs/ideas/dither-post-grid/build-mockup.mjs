// Rebuilds a mockup from the live site: reads the home page's embedded post data,
// downloads the 12 most recent cover images and inlines them, since artifact pages cannot load
// images from other hosts.
//
//   node docs/ideas/dither-post-grid/build-mockup.mjs <output.html> [template.html]
//
// The template defaults to the dither mockup; pass filter-mockup.template.html for the filter study.
import { readFile, writeFile } from "node:fs/promises";
import { strict as assert } from "assert";

const SITE_URL = "https://audeos.com/";
const POST_COUNT = 12;
const IMAGE_QUERY = "?w=640&h=480&fit=fill&f=faces&fm=jpg&q=72";
const PLACEHOLDER = "__POSTS__";
const DEFAULT_TEMPLATE = "mockup.template.html";

const outputPath = process.argv[2];
assert( outputPath, "Usage: node build-mockup.mjs <output.html> [template.html]" );
const templateUrl = new URL( `./${process.argv[3] ?? DEFAULT_TEMPLATE}`, import.meta.url );

function collectPosts( node, found ) {
  if( Array.isArray( node ) ) {
    node.forEach( child => collectPosts( child, found ) );
    return found;
  }
  if( !node || typeof node !== "object" ) return found;
  const fields = node.fields;
  if( fields && fields.slug && fields.title && fields.image?.fields?.file?.url ) found.push( node );
  Object.values( node ).forEach( child => collectPosts( child, found ) );
  return found;
}

async function inlineImage( imageUrl ) {
  const absoluteUrl = imageUrl.startsWith( "//" ) ? `https:${imageUrl}` : imageUrl;
  const response = await fetch( absoluteUrl + IMAGE_QUERY );
  assert( response.ok, `Image download failed (${response.status}): ${absoluteUrl}` );
  const bytes = Buffer.from( await response.arrayBuffer() );
  return `data:image/jpeg;base64,${bytes.toString( "base64" )}`;
}

const homeResponse = await fetch( SITE_URL );
assert( homeResponse.ok, `Home page fetch failed (${homeResponse.status})` );
const html = await homeResponse.text();
const dataMatch = html.match( /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s );
assert( dataMatch, "No __NEXT_DATA__ script on the home page" );

const uniquePosts = new Map();
for( const post of collectPosts( JSON.parse( dataMatch[1] ).props.pageProps, [] ) ) {
  if( !uniquePosts.has( post.fields.slug ) ) uniquePosts.set( post.fields.slug, post );
}
const postDate = post => post.fields.date || post.sys.createdAt;
const recentPosts = [ ...uniquePosts.values() ]
  .sort( ( first, second ) => postDate( second ).localeCompare( postDate( first ) ) )
  .slice( 0, POST_COUNT );
assert( recentPosts.length === POST_COUNT, `Expected ${POST_COUNT} posts, found ${recentPosts.length}` );

const mockupPosts = await Promise.all( recentPosts.map( async post => ({
  title: post.fields.title,
  slug: post.fields.slug,
  date: postDate( post ),
  tags: ( post.metadata?.tags || [] ).map( tag => tag.sys.id ),
  data: await inlineImage( post.fields.image.fields.file.url ),
}) ) );

const template = await readFile( templateUrl, "utf8" );
assert( template.includes( PLACEHOLDER ), `Template has no ${PLACEHOLDER} placeholder` );
await writeFile( outputPath, template.replace( PLACEHOLDER, () => JSON.stringify( mockupPosts ) ) );
console.log( `Wrote ${outputPath} with ${mockupPosts.length} posts` );
