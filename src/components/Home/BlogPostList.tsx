import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "@/components/DateTimeFormat";
import styles from "@/styles/Home.module.scss";
import Picture from "@/components/Picture";
import { Tags } from "@/components/Tags";
import { PAGE_SIZE, POSTS_ANCHOR } from "@/constants";
import { BlogPost } from "@/utils/contentfulUtils";
import { useImageLoaded } from "@/lib/useImageLoaded";
import { useCardFocus } from "@/components/Home/useCardFocus";

const IMAGE_WIDTH = 800;
const OBSERVER_THRESHOLD = 0.15;

function useRevealOnScroll( listRef: React.RefObject<HTMLUListElement | null>, visibleKey: unknown ) {
  useEffect( () => {
    const list = listRef.current;
    if( !list ) return;

    const prefersReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    if( prefersReducedMotion ) {
      list.querySelectorAll( "li" ).forEach( item => item.classList.add( styles.visible ) );
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach( entry => {
          if( entry.isIntersecting ) {
            entry.target.classList.add( styles.visible );
            observer.unobserve( entry.target );
          }
        });
      },
      { threshold: OBSERVER_THRESHOLD },
    );

    list.querySelectorAll( "li" ).forEach( item => observer.observe( item ) );

    return () => observer.disconnect();
  }, [ listRef, visibleKey ] );
}


interface GalleryImageLinkProps {
  url: string
  title: string
  pictureUrl: string
  altText: string
  priority: boolean
}

// The image link shows the hatch until its picture loads.
function GalleryImageLink({ url, title, pictureUrl, altText, priority }: GalleryImageLinkProps ) {
  const { containerRef, loaded, markLoaded } = useImageLoaded<HTMLAnchorElement>();
  return (
    <Link
      ref={ containerRef }
      href={ url }
      aria-label={ title }
      className={ styles.galleryImage }
      data-loaded={ loaded ? "" : undefined }
    >
      <Picture
        url={ pictureUrl }
        maxWidth={ IMAGE_WIDTH }
        alt={ altText }
        priority={ priority }
        onLoad={ markLoaded }
      />
    </Link>
  );
}


// Two copies of the title wrap identically in one grid cell: the hidden back copy paints each
// line's black box and the front copy paints the text, so tightly set lines never cover each other.
function StampTitle({ title }: { title: string }) {
  return (
    <h3>
      <span className={ styles.stampBack } aria-hidden="true"><span>{ title }</span></span>
      <span className={ styles.stampFront }><span>{ title }</span></span>
    </h3>
  );
}


export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
  firstCardPriority?: boolean
}

export default function BlogPostList({ posts, page, tagId, firstCardPriority = false }: BlogPostListProps ) {
  const listRef = useRef<HTMLUListElement>( null );
  const visiblePosts = [ ...posts ]
    .sort( sortBlogPostsByDate )
    .slice( PAGE_SIZE * ( page - 1 ), PAGE_SIZE * page );
  const visibleKey = visiblePosts.map( post => post.sys.id ).join( "," );

  useRevealOnScroll( listRef, visibleKey );
  useCardFocus( listRef );

  return (
    <ul id={ POSTS_ANCHOR } className={ styles.imageGallery } role="list" ref={ listRef }>
      {
        visiblePosts.map( ( post, cardIndex ) => {
          const url = `/post/${post.fields.slug}`;
          return (
            <li key={ post.sys.id } style={ { viewTransitionName: `post-${post.fields.slug}` } }>
              <figure>
                <GalleryImageLink
                  url={ url }
                  title={ post.fields.title }
                  pictureUrl={ post.fields.image?.fields.file?.url || "" }
                  altText={ post.fields.image?.fields.description || "" }
                  priority={ firstCardPriority && cardIndex === 0 }
                />
                <figcaption>
                  <Link href={ url }>
                    <StampTitle title={ post.fields.title } />
                    <DateTimeFormat
                      timestamp={ resolvePostDate( post ) }
                      withTime={ false }
                      withDayName={ false }
                    />
                  </Link>
                  <Tags
                    tags={ post.metadata.tags }
                    tagId={ tagId }
                    variant="stamp"
                  />
                </figcaption>
              </figure>
            </li>
          );
        })
      }
    </ul>
  );
}
