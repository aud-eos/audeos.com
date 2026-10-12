import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeBrand'
 * @name TypeBrandFields
 * @type {TypeBrandFields}
 * @memberof TypeBrand
 */
export interface TypeBrandFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'kind' (Kind)
     * @name Kind
     * @localized false
     */
    kind?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'blurb' (Blurb)
     * @name Blurb
     * @localized false
     */
    blurb?: EntryFieldTypes.Text;
    /**
     * Field type definition for field 'url' (URL)
     * @name URL
     * @localized false
     */
    url?: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'logo' (Logo)
     * @name Logo
     * @localized false
     */
    logo?: EntryFieldTypes.AssetLink;
}

/**
 * Entry skeleton type definition for content type 'brand' (Brand)
 * @name TypeBrandSkeleton
 * @type {TypeBrandSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:52:25.995Z
 * @version 1
 */
export type TypeBrandSkeleton = EntrySkeletonType<TypeBrandFields, "brand">;
/**
 * Entry type definition for content type 'brand' (Brand)
 * @name TypeBrand
 * @type {TypeBrand}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:52:25.995Z
 * @version 1
 */
export type TypeBrand<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeBrandSkeleton, Modifiers, Locales>;

export function isTypeBrand<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: unknown ): entry is TypeBrand<Modifiers, Locales> {
  const candidate = entry as { sys?: { contentType?: { sys?: { id?: string } } } };
  return candidate.sys?.contentType?.sys?.id === "brand";
}

export type TypeBrandWithoutLinkResolutionResponse = TypeBrand<"WITHOUT_LINK_RESOLUTION">;
export type TypeBrandWithoutUnresolvableLinksResponse = TypeBrand<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeBrandWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeBrand<"WITH_ALL_LOCALES", Locales>;
export type TypeBrandWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeBrand<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeBrandWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeBrand<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
