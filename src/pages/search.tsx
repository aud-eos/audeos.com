import { useRouter } from "next/router";
import { useMemo, useRef } from "react";
import Fuse from "fuse.js";

import { getBlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate } from "@/utils/blogPostUtils";
import { getPlaylist } from "@/utils/spotify/getPlaylist";
import { generateSearchIndex } from "@/lib/generateSearchIndex";
import { SearchPost } from "@/lib/searchTypes";
import { Layout } from "@/components/Layout/Layout";
import PostCard, { cardImageFromPost } from "@/components/PostCard/PostCard";
import { useMasonryPlacement } from "@/components/Masonry/useMasonryPlacement";
import { categoryTitleFor } from "@/utils/categoryTitle";
import styles from "@/styles/Home.module.scss";
import searchStyles from "@/styles/Search.module.scss";
import masonryStyles from "@/styles/Masonry.module.scss";
import { META_DESCRIPTION, META_IMAGE, META_TITLE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { stripMarkdown } from "@/utils/stringUtils";

export interface SearchProps {
  posts: SearchPost[];
}

export default function Search({ posts }: SearchProps ) {
  const router = useRouter();
  const query = typeof router.query.q === "string" ? router.query.q : "";

  const fuse = useMemo(
    () =>
      new Fuse( posts, {
        keys: [
          { name: "title", weight: 3 },
          { name: "description", weight: 2 },
          { name: "author", weight: 2 },
          { name: "spotifyText", weight: 1 },
          { name: "tags", weight: 1 },
          { name: "body", weight: 1 },
        ],
        threshold: 0.3,
        ignoreLocation: true,
        minMatchCharLength: 2,
        includeScore: true,
      }),
    [ posts ],
  );

  const results = query
    ? fuse.search( query ).map( result => result.item )
    : [];

  const resultsRef = useRef<HTMLUListElement>( null );
  useMasonryPlacement( resultsRef, results.map( post => post.slug ).join( "," ) );

  return (
    <>
      <SeoHead
        title={ `Search | ${META_TITLE}` }
        canonicalUrl={ `${SITE_URL}/search` }
        description={ META_DESCRIPTION }
        ogImage={ META_IMAGE }
      />
      <Layout isFullwidth>
        <main className={ styles.main }>
          <section className={ searchStyles.searchResults }>
            { query && (
              <p className={ searchStyles.resultCount }>
                { results.length } result{ results.length !== 1 ? "s" : "" } for &ldquo;{ query }&rdquo;
              </p>
            ) }
            { !query && (
              <p className={ searchStyles.resultCount }>Enter a search term above.</p>
            ) }

            <ul
              ref={ resultsRef }
              className={ `${searchStyles.resultList} ${masonryStyles.masonry}` }
              role="list"
            >
              { results.map( post => (
                <li key={ post.slug }>
                  <PostCard
                    card={ {
                      href: `/post/${post.slug}`,
                      title: post.title,
                      timestamp: post.date,
                      categoryLabel: categoryTitleFor( post.category ),
                      image: post.image,
                    } }
                  />
                </li>
              ) ) }
            </ul>
          </section>
        </main>
      </Layout>
    </>
  );
}


function buildSpotifyText( playlist: Awaited<ReturnType<typeof getPlaylist>> ): string {
  const trackNames = playlist.tracks.items.map( item => item.track.name );
  const artistNames = playlist.tracks.items.flatMap( item => item.track.artists.map( artist => artist.name ) );
  return [ playlist.name, playlist.description ?? "", ...trackNames, ...artistNames ]
    .filter( Boolean )
    .join( " " );
}

export async function getStaticProps() {
  const blogPosts = await getBlogPosts();

  const posts: SearchPost[] = await Promise.all(
    blogPosts.items.map( async post => {
      const spotifyText = post.fields.spotifyPlaylistId
        ? await getPlaylist( post.fields.spotifyPlaylistId )
          .then( buildSpotifyText )
          .catch( () => "" )
        : "";

      return {
        title: post.fields.title ?? "",
        slug: post.fields.slug ?? "",
        description: post.fields.description ?? "",
        body: stripMarkdown( post.fields.body ?? "" ),
        author: post.fields.author?.fields?.name ?? "",
        spotifyText,
        tags: post.metadata.tags.map( tag => tag.sys.id ),
        date: resolvePostDate( post ),
        category: post.fields.category,
        image: cardImageFromPost( post ),
      };
    }),
  );

  generateSearchIndex( posts );
  return { props: { posts } };
}
