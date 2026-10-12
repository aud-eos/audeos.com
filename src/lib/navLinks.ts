import { AUTHOR_SLUG, CATEGORY_IDS, CATEGORY_TITLES } from "@/constants";

export interface NavLink {
  href: string;
  label: string;
}

export const ABOUT_LABEL = "About";

export function buildNavLinks(): NavLink[] {
  const categoryLinks = CATEGORY_IDS.map( categoryId => ({ href: `/category/${categoryId}`, label: CATEGORY_TITLES[categoryId] }) );
  return [ ...categoryLinks, { href: `/author/${AUTHOR_SLUG}`, label: ABOUT_LABEL } ];
}

export function isActivePath( currentPath: string, href: string ): boolean {
  const [ path ] = currentPath.split( /[?#]/ );
  return path === href || path.startsWith( `${href}/` );
}
