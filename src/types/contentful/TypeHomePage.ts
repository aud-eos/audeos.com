import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeHomePage'
 * @name TypeHomePageFields
 * @type {TypeHomePageFields}
 * @memberof TypeHomePage
 */
export interface TypeHomePageFields {
    /**
     * Field type definition for field 'seoTitle' (Page title)
     * @name Page title
     * @localized false
     */
    seoTitle: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'seoDescription' (Meta description)
     * @name Meta description
     * @localized false
     */
    seoDescription: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'lines' (Stacked lines)
     * @name Stacked lines
     * @localized false
     */
    lines?: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
    /**
     * Field type definition for field 'showNowPlaying' (Show the live now-playing line)
     * @name Show the live now-playing line
     * @localized false
     */
    showNowPlaying: EntryFieldTypes.Boolean;
    /**
     * Field type definition for field 'hireLinkLabel' (Hire link label)
     * @name Hire link label
     * @localized false
     */
    hireLinkLabel: EntryFieldTypes.Symbol;
}

/**
 * Entry skeleton type definition for content type 'homePage' (Home page)
 * @name TypeHomePageSkeleton
 * @type {TypeHomePageSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:53:04.613Z
 * @version 1
 */
export type TypeHomePageSkeleton = EntrySkeletonType<TypeHomePageFields, "homePage">;
/**
 * Entry type definition for content type 'homePage' (Home page)
 * @name TypeHomePage
 * @type {TypeHomePage}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:53:04.613Z
 * @version 1
 */
export type TypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeHomePageSkeleton, Modifiers, Locales>;

export function isTypeHomePage<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: unknown ): entry is TypeHomePage<Modifiers, Locales> {
  const candidate = entry as { sys?: { contentType?: { sys?: { id?: string } } } };
  return candidate.sys?.contentType?.sys?.id === "homePage";
}

export type TypeHomePageWithoutLinkResolutionResponse = TypeHomePage<"WITHOUT_LINK_RESOLUTION">;
export type TypeHomePageWithoutUnresolvableLinksResponse = TypeHomePage<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeHomePageWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeHomePage<"WITH_ALL_LOCALES", Locales>;
export type TypeHomePageWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeHomePage<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeHomePageWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeHomePage<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
