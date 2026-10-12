import { useId } from "react";
import Link from "next/link";
import Picture from "@/components/Picture";
import { BlogPost } from "@/utils/contentfulUtils";
import { formatCardDate } from "@/utils/formatCardDate";
import styles from "@/styles/PostCard.module.scss";
import { useImageLoaded } from "@/lib/useImageLoaded";

const IMAGE_WIDTH = 800;
const PLACEHOLDER_RATIO = "4 / 3";

export interface PostCardImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface PostCardData {
  href: string;
  title: string;
  timestamp: string;
  categoryLabel: string;
  image: PostCardImage | null;
}

export function cardImageFromPost( post: BlogPost ): PostCardImage | null {
  const file = post.fields.image?.fields.file;
  if( !file?.url ) return null;
  const dimensions = file.details.image;
  if( !dimensions ) {
    throw new Error( `PostCard: cover image for post "${post.fields.slug}" has no width and height in Contentful` );
  }
  return {
    url: file.url,
    alt: post.fields.image?.fields.description || "",
    width: dimensions.width,
    height: dimensions.height,
  };
}

export interface PostCardProps {
  card: PostCardData;
  priority?: boolean;
}

export default function PostCard({ card, priority = false }: PostCardProps ) {
  const titleId = useId();
  const { containerRef: frameRef, loaded: imageLoaded, markLoaded } = useImageLoaded<HTMLSpanElement>();
  const coverRatio = card.image ? `${card.image.width} / ${card.image.height}` : PLACEHOLDER_RATIO;
  return (
    <Link href={ card.href } className={ styles.card } aria-labelledby={ titleId }>
      <span
        ref={ frameRef }
        className={ styles.frame }
        data-frame
        data-ratio={ coverRatio }
        data-loaded={ imageLoaded ? "" : undefined }
        style={ { aspectRatio: coverRatio } }
      >
        { card.image && (
          <Picture
            url={ card.image.url }
            maxWidth={ IMAGE_WIDTH }
            alt={ card.image.alt }
            priority={ priority }
            onLoad={ markLoaded }
          />
        ) }
      </span>
      <span className={ styles.meta }>
        <time dateTime={ card.timestamp }>{ formatCardDate( card.timestamp ) }</time>
        <span className={ styles.category }>{ card.categoryLabel }</span>
      </span>
      <h3 id={ titleId } className={ styles.title }>{ card.title }</h3>
    </Link>
  );
}
