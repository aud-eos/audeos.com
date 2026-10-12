import type { ChainModifiers, Entry, EntryFieldTypes, EntrySkeletonType, LocaleCode } from "contentful";

/**
 * Fields type definition for content type 'TypeServicePackage'
 * @name TypeServicePackageFields
 * @type {TypeServicePackageFields}
 * @memberof TypeServicePackage
 */
export interface TypeServicePackageFields {
    /**
     * Field type definition for field 'name' (Name)
     * @name Name
     * @localized false
     */
    name: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'group' (Group)
     * @name Group
     * @localized false
     */
    group: EntryFieldTypes.Symbol<"dj" | "speakerRental">;
    /**
     * Field type definition for field 'price' (Price (whole dollars))
     * @name Price (whole dollars)
     * @localized false
     */
    price: EntryFieldTypes.Integer;
    /**
     * Field type definition for field 'priceOperated' (Price with the owner running sound (rentals))
     * @name Price with the owner running sound (rentals)
     * @localized false
     */
    priceOperated?: EntryFieldTypes.Integer;
    /**
     * Field type definition for field 'priceUnit' (Price unit)
     * @name Price unit
     * @localized false
     */
    priceUnit: EntryFieldTypes.Symbol;
    /**
     * Field type definition for field 'includes' (Includes)
     * @name Includes
     * @localized false
     */
    includes?: EntryFieldTypes.Array<EntryFieldTypes.Symbol>;
}

/**
 * Entry skeleton type definition for content type 'servicePackage' (Service package)
 * @name TypeServicePackageSkeleton
 * @type {TypeServicePackageSkeleton}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:52:25.181Z
 * @version 1
 */
export type TypeServicePackageSkeleton = EntrySkeletonType<TypeServicePackageFields, "servicePackage">;
/**
 * Entry type definition for content type 'servicePackage' (Service package)
 * @name TypeServicePackage
 * @type {TypeServicePackage}
 * @author 5qtbtLdlsTzODfegrwA2Ez
 * @since 2026-10-12T08:52:25.181Z
 * @version 1
 */
export type TypeServicePackage<Modifiers extends ChainModifiers, Locales extends LocaleCode = LocaleCode> = Entry<TypeServicePackageSkeleton, Modifiers, Locales>;

export function isTypeServicePackage<Modifiers extends ChainModifiers, Locales extends LocaleCode>( entry: unknown ): entry is TypeServicePackage<Modifiers, Locales> {
  const candidate = entry as { sys?: { contentType?: { sys?: { id?: string } } } };
  return candidate.sys?.contentType?.sys?.id === "servicePackage";
}

export type TypeServicePackageWithoutLinkResolutionResponse = TypeServicePackage<"WITHOUT_LINK_RESOLUTION">;
export type TypeServicePackageWithoutUnresolvableLinksResponse = TypeServicePackage<"WITHOUT_UNRESOLVABLE_LINKS">;
export type TypeServicePackageWithAllLocalesResponse<Locales extends LocaleCode = LocaleCode> = TypeServicePackage<"WITH_ALL_LOCALES", Locales>;
export type TypeServicePackageWithAllLocalesAndWithoutLinkResolutionResponse<Locales extends LocaleCode = LocaleCode> = TypeServicePackage<"WITHOUT_LINK_RESOLUTION" | "WITH_ALL_LOCALES", Locales>;
export type TypeServicePackageWithAllLocalesAndWithoutUnresolvableLinksResponse<Locales extends LocaleCode = LocaleCode> = TypeServicePackage<"WITHOUT_UNRESOLVABLE_LINKS" | "WITH_ALL_LOCALES", Locales>;
