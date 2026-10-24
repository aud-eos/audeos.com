import Link from "next/link";
import { BlogPosts } from "@/utils/contentfulUtils";
import BlogPostList from "@/components/Home/BlogPostList";
import { CATEGORY_IDS, CATEGORY_TITLES, POSTS_PER_CATEGORY_SECTION } from "@/constants";
import { sortBlogPostsByDate } from "@/utils/blogPostUtils";
import styles from "@/styles/Home.module.scss";

export interface CategoryPostSectionsProps {
  posts: BlogPosts;
}

export default function CategoryPostSections({ posts }: CategoryPostSectionsProps ) {
  const sections = CATEGORY_IDS
    .map( categoryId => {
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return { categoryId, categoryPosts };
    })
    .filter( section => section.categoryPosts.length > 0 );
  // Each section's first card index on the page, so the halftone colors run on across sections.
  const colorOffsets = sections.map( ( _section, sectionIndex ) => sections
    .slice( 0, sectionIndex )
    .reduce( ( total, previous ) => total + previous.categoryPosts.length, 0 ) );

  return (
    <>
      { sections.map( ( section, sectionIndex ) => {
        const title = CATEGORY_TITLES[section.categoryId];
        return (
          <section
            key={ section.categoryId }
            id={ `category-${section.categoryId}` }
            className={ styles.tagSection }
          >
            <header className={ styles.tagSectionHeader }>
              <h2>
                <Link href={ `/category/${section.categoryId}` }>{ title }</Link>
              </h2>
            </header>
            <BlogPostList
              posts={ section.categoryPosts }
              page={ 1 }
              firstCardPriority={ sectionIndex === 0 }
              colorOffset={ colorOffsets[sectionIndex] }
            />
            <div className={ styles.seeAllFooter }>
              <Link
                href={ `/category/${section.categoryId}` }
                className={ styles.seeAll }
              >
                See all { title } →
              </Link>
            </div>
          </section>
        );
      }) }
    </>
  );
}
