import { FC, ReactNode } from "react";
import Link from "next/link";

export interface OptionalLinkProps {
  href: string | undefined;
  children: ReactNode;
}

/**
 * A link whose target may be missing. oEmbed providers omit fields such as
 * `author_url` for some media; rendering plain text then keeps the page
 * buildable instead of handing `next/link` an undefined href.
 */
export const OptionalLink: FC<OptionalLinkProps> = ({ href, children }) => {
  if( !href ) return <span>{ children }</span>;
  return <Link href={ href } target="_blank" rel="noopener noreferrer">{ children }</Link>;
};
