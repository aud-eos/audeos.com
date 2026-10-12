import { CATEGORY_TITLES, isCategoryId } from "@/constants";

export function categoryTitleFor( categoryId: string | undefined ): string {
  if( categoryId === undefined || !isCategoryId( categoryId ) ) {
    throw new Error( `categoryTitleFor: unknown category "${categoryId}"` );
  }
  return CATEGORY_TITLES[categoryId];
}
