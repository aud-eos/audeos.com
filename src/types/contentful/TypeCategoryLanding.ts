import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";
import type { TypeServicePackageSkeleton } from "./TypeServicePackage";

/**
 * Fields type definition for content type 'TypeCategoryLanding'
 * @name TypeCategoryLandingFields
 * @type {TypeCategoryLandingFields}
 * @memberof TypeCategoryLanding
 */
export interface TypeCategoryLandingFields {
    /**
     * Field type definition for field 'category' (Category)
     * @name Category
     * @localized false
     */
    category: EntryFieldTypes.Symbol<"events" | "lifestyle" | "music">;
    /**
     * Field type definition for field 'description' (Search description)
     * @name Search description
     * @localized false
     */
    description: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'intro' (Intro (markdown))
     * @name Intro (markdown)
     * @localized false
     */
    intro?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'body' (Body (markdown))
     * @name Body (markdown)
     * @localized false
     */
    body?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'packages' (Packages)
     * @name Packages
     * @localized false
     */
    packages?: EntryFieldTypes.Array<EntryFieldTypes.EntryLink<TypeServicePackageSkeleton>>;
    /**
     * Field type definition for field 'rentalHeading' (Rental heading)
     * @name Rental heading
     * @localized false
     */
    rentalHeading?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'footnote' (Footnote)
     * @name Footnote
     * @localized false
     */
    footnote?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ctaLabel' (Booking link label)
     * @name Booking link label
     * @localized false
     */
    ctaLabel?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ctaUrl' (Booking link URL)
     * @name Booking link URL
     * @localized false
     */
    ctaUrl?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'ogImage' (Social image)
     * @name Social image
     * @localized false
     */
    ogImage?: EntryFieldTypes.AssetLink;
}

/**
 * Entry skeleton type definition for content type 'categoryLanding' (Category landing)
 * @name TypeCategoryLandingSkeleton
 * @type {TypeCategoryLandingSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:55:18.924Z
 * @version 1
 */
export type TypeCategoryLandingSkeleton = EntrySkeletonType<TypeCategoryLandingFields, "categoryLanding">;
/**
 * Entry type definition for content type 'categoryLanding' (Category landing)
 * @name TypeCategoryLanding
 * @type {TypeCategoryLanding}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:55:18.924Z
 * @version 1
 */
export type TypeCategoryLanding<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeCategoryLandingSkeleton, Modifiers, Locales>;

export function isTypeCategoryLanding<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: unknown ): entry is TypeCategoryLanding<Modifiers, Locales> {
  const candidate = entry as { sys?: { contentType?: { sys?: { id?: string } } } };
  return candidate.sys?.contentType?.sys?.id === "categoryLanding";
}

export type TypeCategoryLandingWithoutLinkResolutionResponse = TypeCategoryLanding<"WITHOUT_LINK_RESOLUTION">;
export type TypeCategoryLandingWithoutUnresolvableLinksResponse = TypeCategoryLanding<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeCategoryLandingWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeCategoryLanding<"WITH_ALL_LOCALES", Locales>;
export type TypeCategoryLandingWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeCategoryLanding<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeCategoryLandingWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeCategoryLanding<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
