import type { BlogPost } from "@/utils/contentfulUtils";

type PostFields = BlogPost["fields"];
type PostImage = NonNullable<PostFields["image"]>;
type Timestamp = BlogPost["sys"]["createdAt"];

export interface CoverSpec {
  url: string;
  description?: string;
  dimensions?: { width: number; height: number };
}

const SPACE_LINK = { sys: { type: "Link", linkType: "Space", id: "space" } } as const;
const ENVIRONMENT_LINK = { sys: { type: "Link", linkType: "Environment", id: "master" } } as const;
const BLOG_POST_TYPE_LINK = { sys: { type: "Link", linkType: "ContentType", id: "blogPost" } } as const;

const TIMESTAMP_PATTERN = /^\d+-\d+-\d+T\d+:\d+:\d+Z$/;

function isTimestamp( value: string ): value is Timestamp {
  return TIMESTAMP_PATTERN.test( value );
}

function toTimestamp( value: string ): Timestamp {
  if( !isTimestamp( value ) ) throw new Error( `makeBlogPost: "${value}" is not a UTC timestamp` );
  return value;
}

function makeSys( id: string, createdAt: Timestamp ): BlogPost["sys"] {
  return {
    type: "Entry",
    id,
    createdAt,
    updatedAt: createdAt,
    revision: 1,
    publishedVersion: 1,
    space: SPACE_LINK,
    environment: ENVIRONMENT_LINK,
    contentType: BLOG_POST_TYPE_LINK,
    locale: "en-US",
  };
}

function makeCover( cover: CoverSpec ): PostImage {
  return {
    metadata: { tags: [], concepts: [] },
    sys: {
      type: "Asset",
      id: `asset-${cover.url}`,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      revision: 1,
      publishedVersion: 1,
      space: SPACE_LINK,
      environment: ENVIRONMENT_LINK,
      locale: "en-US",
    },
    fields: {
      title: "cover",
      description: cover.description,
      file: {
        url: cover.url,
        fileName: "cover",
        contentType: "image/png",
        details: cover.dimensions
          ? { size: 1, image: cover.dimensions }
          : { size: 1 },
      },
    },
  };
}

export interface PostSpec {
  id?: string;
  title?: string;
  slug?: string;
  date?: string;
  createdAt?: string;
  category?: PostFields["category"];
  cover?: CoverSpec;
}

export function makeBlogPost( spec: PostSpec = {}): BlogPost {
  const {
    id = "1",
    title = "Kick Off Day Party",
    slug = "kick-off-day-party",
    date = "2026-06-11T00:00:00Z",
    createdAt = "2026-06-01T00:00:00Z",
    category = "events",
    cover,
  } = spec;
  return {
    sys: makeSys( id, toTimestamp( createdAt ) ),
    metadata: { tags: [], concepts: [] },
    fields: {
      title,
      slug,
      date: toTimestamp( date ),
      category,
      description: "",
      author: undefined,
      image: cover ? makeCover( cover ) : undefined,
    },
  };
}
