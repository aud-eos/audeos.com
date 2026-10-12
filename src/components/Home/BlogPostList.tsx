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

const IMAGE_WIDTH = 800;
const OBSERVER_THRESHOLD = 0.15;
const LONG_PRESS_DURATION = 500;
const TOUCH_MOVE_THRESHOLD = 10;

function useCardInteractions( listRef: React.RefObject<HTMLUListElement | null> ) {
  useEffect( () => {
    const listOrNull = listRef.current;
    if( !listOrNull ) return;
    const list: HTMLUListElement = listOrNull;

    const isTouchDevice = window.matchMedia( "(hover: none)" ).matches;
    const prefersReducedMotion = window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches;
    if( !isTouchDevice || prefersReducedMotion ) return;

    let pressTimer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    let activeCard: HTMLElement | null = null;

    function clearPreview() {
      if( activeCard ) {
        activeCard.classList.remove( styles.longPressPreview );
        activeCard = null;
      }
      if( pressTimer ) {
        clearTimeout( pressTimer );
        pressTimer = null;
      }
    }

    function handleTouchStart( event: TouchEvent ) {
      if( !( event.target instanceof Element ) ) return;
      const card = event.target.closest( "li" );
      if( !card || !( card instanceof HTMLElement ) || !list.contains( card ) ) return;

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      pressTimer = setTimeout( () => {
        activeCard = card;
        activeCard.classList.add( styles.longPressPreview );
      }, LONG_PRESS_DURATION );
    }

    function handleTouchMove( event: TouchEvent ) {
      if( !pressTimer && !activeCard ) return;
      const touch = event.touches[0];
      const deltaX = Math.abs( touch.clientX - startX );
      const deltaY = Math.abs( touch.clientY - startY );
      if( deltaX > TOUCH_MOVE_THRESHOLD || deltaY > TOUCH_MOVE_THRESHOLD ) {
        clearPreview();
      }
    }

    function handleTouchEnd() {
      clearPreview();
    }

    list.addEventListener( "touchstart", handleTouchStart, { passive: true });
    list.addEventListener( "touchmove", handleTouchMove, { passive: true });
    list.addEventListener( "touchend", handleTouchEnd );
    list.addEventListener( "touchcancel", handleTouchEnd );

    return () => {
      list.removeEventListener( "touchstart", handleTouchStart );
      list.removeEventListener( "touchmove", handleTouchMove );
      list.removeEventListener( "touchend", handleTouchEnd );
      list.removeEventListener( "touchcancel", handleTouchEnd );
      clearPreview();
    };
  }, [ listRef ] );
}

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
  useCardInteractions( listRef );

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
                    <h3>{ post.fields.title }</h3>
                    <DateTimeFormat timestamp={ resolvePostDate( post ) } />
                  </Link>
                </figcaption>
                <Tags
                  tags={ post.metadata.tags }
                  tagId={ tagId }
                />
              </figure>
            </li>
          );
        })
      }
    </ul>
  );
}
