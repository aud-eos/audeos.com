import { BlogPosts } from "@/utils/contentfulUtils";
import { resolvePostDate, sortBlogPostsByDate } from "@/utils/blogPostUtils";
import { HomeContent, LandingMap } from "@/lib/siteContent";
import {
  CATEGORY_IDS,
  CATEGORY_TITLES,
  POSTS_PER_CATEGORY_SECTION,
  SITE_URL,
} from "@/constants";

export function buildHomepageSchema( posts: BlogPosts, landings: LandingMap, home: HomeContent ) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": home.seoTitle,
    "description": home.seoDescription,
    "url": SITE_URL,
    "isPartOf": {
      "@type": "WebSite",
      "name": home.seoTitle,
      "url": SITE_URL,
    },
    "hasPart": CATEGORY_IDS.map( categoryId => {
      const categoryPosts = posts.items
        .filter( post => post.fields.category === categoryId )
        .sort( sortBlogPostsByDate )
        .slice( 0, POSTS_PER_CATEGORY_SECTION );
      return {
        "@type": "CollectionPage",
        "name": CATEGORY_TITLES[categoryId],
        "description": landings[categoryId].description,
        "url": `${SITE_URL}/category/${categoryId}`,
        "hasPart": categoryPosts.map( post => {
          const imageUrl = post.fields.image?.fields.file?.url;
          return {
            "@type": "BlogPosting",
            "headline": post.fields.title,
            "url": `${SITE_URL}/post/${post.fields.slug}`,
            "datePublished": resolvePostDate( post ),
            "image": imageUrl ? `https:${imageUrl}` : undefined,
          };
        }),
      };
    }),
  };
}
