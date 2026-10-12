import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { loadSiteContent } from "@/lib/siteContent";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { CATEGORY_TITLES, isCategoryId, META_IMAGE, SITE_URL } from "@/constants";

export async function getCategoryStaticProps( context: GetStaticPropsContext ) {
  const slugParam = context.params?.slug;
  if( typeof slugParam !== "string" || !isCategoryId( slugParam ) ) {
    throw new Error( `getCategoryStaticProps: unknown category slug "${String( slugParam )}"` );
  }
  const page: number = Number( context.params?.page ) || 1;
  const [ posts, { landings } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );
  const landing = landings[slugParam];
  const title = CATEGORY_TITLES[slugParam];

  const seo: ArchiveSeo = {
    title: page > 1
      ? `${title} — Page ${page} | Audeos.com`
      : `${title} | Audeos.com`,
    description: landing.description,
    ogImage: landing.ogImageUrl ? `https:${landing.ogImageUrl}` : META_IMAGE,
    canonical: `${SITE_URL}/category/${slugParam}${page > 1 ? `/page/${page}` : ""}`,
  };

  const filter: ArchiveFilter = { kind: "category", id: slugParam };

  return {
    props: { posts, page, filter, seo, heading: title, landing: page === 1 ? landing : null },
  };
}
