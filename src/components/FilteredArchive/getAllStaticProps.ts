import { GetStaticPropsContext } from "next";
import { getBlogPosts } from "@/utils/contentfulUtils";
import { loadSiteContent } from "@/lib/siteContent";
import { ArchiveFilter, ArchiveSeo } from "@/types/archiveFilter";
import { META_DESCRIPTION, META_IMAGE, SITE_URL } from "@/constants";

export async function getAllStaticProps( context: GetStaticPropsContext ) {
  const page: number = Number( context.params?.page ) || 1;
  const posts = await getBlogPosts();
  await loadSiteContent();

  const seo: ArchiveSeo = {
    title: `Blog — Page ${page} | Audeos.com`,
    description: META_DESCRIPTION,
    ogImage: META_IMAGE,
    canonical: `${SITE_URL}/page/${page}`,
  };

  const filter: ArchiveFilter = { kind: "all" };

  return {
    props: { posts, page, filter, seo },
  };
}
