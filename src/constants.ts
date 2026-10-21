export const META_TITLE = "Audeos.com";
export const META_DESCRIPTION = "Official website of DJ Audeos";
export const META_IMAGE = "https://www.audeos.com/images/audeos.jpg";
export const SITE_URL = "https://www.audeos.com";
export const CONTENT_TYPE_BLOG_POST = "blogPost";
export const CONTENT_TYPE_AUTHOR = "author";
export const CONTENT_TYPE_CATEGORY_LANDING = "categoryLanding";
export const CONTENT_TYPE_HOME_PAGE = "homePage";
export const GOOGLE_ANALYTICS_ID = "G-D81YP4DGH3";
export const COOKIE_CONSENT_KEY = "cookie-consent";
export const POSTS_ANCHOR = "posts";
export const PAGE_SIZE = 24;
export const CONTENT_IMAGE_WIDTH = 750;
export const POSTS_PER_TAG_SECTION = 3;
export const POSTS_PER_CATEGORY_SECTION = 12;
export const CATEGORY_IDS = [ "music", "events", "lifestyle" ] as const;
export type CategoryId = ( typeof CATEGORY_IDS )[number];
// Titles are code, not content: the top bar, search page and post page need them while rendering.
export const CATEGORY_TITLES: Record<CategoryId, string> = { music: "Music", events: "Events", lifestyle: "Lifestyle" };
export const HIRE_PATH = "/category/events";

export function isCategoryId( value: string ): value is CategoryId {
  return CATEGORY_IDS.some( categoryId => categoryId === value );
}
export const STREAM_ORIGIN = "https://audeos.fm";
export const AUTHOR_SLUG = "audeos";
export const STREAM_CHANNEL_URL = STREAM_ORIGIN;

export const LIVE_LINE_PREFIX = "Now playing on audeos.fm";

export const GEAR_ONLY_LABEL = "Gear only";
export const WITH_ME_LABEL = "With me";
export const PRICE_LABEL = "Price";
export const DJ_PACKAGES_HEADING = "DJ packages";
