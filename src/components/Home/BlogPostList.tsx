import Link from "next/link";
import { TypeBlogPost } from "@/types";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import DateTimeFormat from "../DateTimeFormat";
import Image from "next/image";
import styles from "@/styles/Home.module.scss";


const IMAGE_SIZE = 350;


export interface BlogPostListProps {
  posts: TypeBlogPost[];
}

export default function BlogPostList({ posts }: BlogPostListProps ){
  return (
    <ul className={ styles.imageGallery }>
      {
        posts
          .sort( sortBlogPostsByDate )
          .map( post => {
            const url = `/post/${post.fields.slug}`;
            return (
              <li key={ post.sys.id }>
                <Link href={ url }>
                  <figure>
                    <Image
                      src={ `https:${post.fields.image?.fields.file.url}?h=${IMAGE_SIZE}` }
                      alt={ post.fields.image?.fields.description || "" }
                      fill
                    />
                    <figcaption>
                      <h3>{ post.fields.title }</h3>
                      <h5><DateTimeFormat timestamp={ post.fields.date || post.sys.createdAt } /></h5>
                    </figcaption>
                  </figure>
                </Link>
              </li>
          );
        })
      }
    </ul>
  );
}
