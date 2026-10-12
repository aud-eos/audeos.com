import GiantWord from "@/components/GiantWord/GiantWord";
import Link from "next/link";
import styles from "@/styles/Home.module.scss";
import { BlogPosts, getBlogPosts } from "@/utils/contentfulUtils";
import { Layout } from "@/components/Layout/Layout";
import CategoryPostSections from "@/components/Home/CategoryPostSections";
import NowPlayingCard from "@/components/NowPlaying/NowPlayingCard";
import { generateFeeds } from "@/lib/generateFeeds";
import { buildHomepageSchema } from "@/lib/homepageSchema";
import { JsonLd } from "@/components/JsonLd";
import { META_IMAGE, SITE_URL } from "@/constants";
import { SeoHead } from "@/components/SeoHead";
import { HomeContent, loadSiteContent } from "@/lib/siteContent";

export interface HomeProps {
  posts: BlogPosts;
  home: HomeContent;
  schema: ReturnType<typeof buildHomepageSchema>;
}

export default function Home({ posts, home, schema }: HomeProps ) {
  return (
    <>
      <SeoHead
        title={ home.seoTitle }
        canonicalUrl={ SITE_URL }
        description={ home.seoDescription }
        ogImage={ META_IMAGE }
      >
        <link rel="alternate" type="application/rss+xml" href="/rss.xml" />
        <link rel="alternate" type="application/atom+xml" href="/atom.xml" />
        <link rel="alternate" type="application/feed+json" href="/feed.json" />
        <JsonLd schema={ schema } />
      </SeoHead>
      <Layout isFullwidth>
        <main className={ styles.main }>
          <GiantWord text="Audeos" stackedLogoOnPhone />
          <NowPlayingCard />
          <CategoryPostSections posts={ posts } />
          <Link href="/page/1" className={ styles.allPostsLink }>
            Browse all posts →
          </Link>
        </main>
      </Layout>
    </>
  );
}

export async function getStaticProps() {
  const [ posts, { landings, home } ] = await Promise.all( [ getBlogPosts(), loadSiteContent() ] );
  generateFeeds( posts.items );
  const schema = buildHomepageSchema( posts, landings, home );
  return { props: { posts, home, schema } };
}
