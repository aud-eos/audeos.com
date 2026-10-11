import Link from "next/link";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { CATEGORY_IDS, POSTS_PER_CATEGORY_SECTION } from "@/constants";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { CategoryConfigMap } from "@/types/categoryConfig";
import styles from "@/styles/Home.module.scss";

export interface CategoryPostSectionsProps {
  posts: BlogPosts;
  categoryConfig: CategoryConfigMap;
}

export default function CategoryPostSections({ posts, categoryConfig }: CategoryPostSectionsProps ) {
  const sections = CATEGORY_IDS
    .map( categoryId => {
      const allInCategory = posts.items.filter( post => post.fields.category === categoryId );
      const categoryPosts = [ ...allInCategory ]
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return { categoryId, categoryPosts, total: allInCategory.length };
    })
    .filter( section => section.categoryPosts.length > 0 );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const config = categoryConfig[section.categoryId];
        if( !config ) {
          throw new Error( `CategoryPostSections: no categoryConfig entry for "${section.categoryId}"` );
        }
        const href = `/category/${section.categoryId}`;
        return (
          <section key={ section.categoryId } id={ `category-${section.categoryId}` } className={ styles.categorySection }>
            <header className={ styles.categoryHeader }>
              <h2 className={ styles.categoryWord }>
                <Link href={ href }>{ config.title }</Link>
              </h2>
              <Link href={ href } className={ styles.seeAll }>See all { section.total } →</Link>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
            />
            <Link href={ href } className={ styles.allLink }>
              All { section.total } { config.title.toLowerCase() } →
            </Link>
          </section>
        );
      }) }
    </>
  );
}
