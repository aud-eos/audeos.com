import React, { useEffect, useRef } from "react";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import styles from "@/styles/Home.module.scss";
import PostCard, { cardDataFromPost } from "@/components/PostCard/PostCard";
import { useMasonryPlacement } from "@/components/Masonry/useMasonryPlacement";
import masonryStyles from "@/styles/Masonry.module.scss";
import { PAGE_SIZE, POSTS_ANCHOR } from "@/constants";
import { BlogPost } from "@/utils/contentfulUtils";
import categoriesData from "../../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";

const CATEGORY_CONFIG: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;

function categoryLabelFor( post: BlogPost ): string {
  const category = post.fields.category;
  const config = category ? CATEGORY_CONFIG[category] : undefined;
  if( !config ) {
    throw new Error( `BlogPostList: post "${post.fields.slug}" has unknown category "${category}"` );
  }
  return config.title;
}

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


export interface BlogPostListProps {
  posts: BlogPost[]
  page: number
  tagId?: string
  firstCardPriority?: boolean
}

export default function BlogPostList({ posts, page, tagId, firstCardPriority = false }: BlogPostListProps ) {
  const listRef = useRef<HTMLUListElement>( null );

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
  }, [ posts, page, tagId ] );

  useCardInteractions( listRef );
  useMasonryPlacement( listRef, `${page}-${tagId}-${posts.length}` );

  return (
    <ul id={ POSTS_ANCHOR } className={ `${styles.imageGallery} ${masonryStyles.masonry}` } role="list" ref={ listRef }>
      {
        [ ...posts ]
          .sort( sortBlogPostsByDate )
          .slice( PAGE_SIZE * ( page - 1 ), PAGE_SIZE * page )
          .map( ( post, cardIndex ) => {

            return (
              <li key={ post.sys.id } style={ { viewTransitionName: `post-${post.fields.slug}` } }>
                <PostCard
                  card={ cardDataFromPost( post, categoryLabelFor( post ) ) }
                  priority={ firstCardPriority && cardIndex === 0 }
                />
              </li>
            );
          })
      }
    </ul>
  );
}
