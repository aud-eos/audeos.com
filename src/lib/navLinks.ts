import { AUTHOR_SLUG, CATEGORY_IDS } from "@/constants";
import { CategoryConfigMap } from "@/types/categoryConfig";

export interface NavLink {
  href: string;
  label: string;
}

export const ABOUT_LABEL = "About";

export function buildNavLinks( categoryConfig: CategoryConfigMap ): NavLink[] {
  const categoryLinks = CATEGORY_IDS.map( categoryId => {
    const config = categoryConfig[categoryId];
    if( !config ) {
      throw new Error( `buildNavLinks: no categoryConfig entry for "${categoryId}"` );
    }
    return { href: `/category/${categoryId}`, label: config.title };
  });
  return [ ...categoryLinks, { href: `/author/${AUTHOR_SLUG}`, label: ABOUT_LABEL } ];
}

export function isActivePath( currentPath: string, href: string ): boolean {
  const [ path ] = currentPath.split( /[?#]/ );
  return path === href || path.startsWith( `${href}/` );
}
