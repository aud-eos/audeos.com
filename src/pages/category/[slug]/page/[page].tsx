import { getBlogPosts } from "@/utils/contentfulUtils";
import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CATEGORY_IDS, PAGE_SIZE } from "@/constants";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  const posts = await getBlogPosts();
  const paths: { params: { slug: string, page: string } }[] = [];

  for( const slug of CATEGORY_IDS ) {
    const filteredPosts = posts.items.filter( post => post.fields.category === slug );
    const numPages = Math.ceil( filteredPosts.length / PAGE_SIZE );
    for( let page = 2; page <= numPages; page++ ) {
      paths.push({ params: { slug, page: page.toString() } });
    }
  }

  return {
    paths,
    fallback: false,
  };
}

export default FilteredArchive;
