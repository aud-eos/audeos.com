import { TagLink } from "contentful";
import { FC } from "react";

import styles from "@/styles/Tags.module.scss";
import Link from "next/link";


export interface TagProps {
  tagName: string;
  isTagged?: boolean;
}

const TagComponent: FC<TagProps> = ({ tagName, isTagged }) => {
  const className = isTagged ? styles.isTagged : undefined;
  const href = isTagged ? "/" : `/tags/${tagName}`;
  return (
    <Link href={ href }>
      <code className={ className }>#{ tagName }</code>
    </Link>
  );
};


export type TagsVariant = "pill" | "stamp";

export interface TagsProps {
  tags: { sys: TagLink; }[];
  tagId?: string;
  // "stamp" renders flat chips on a black bar for the post grid's centered caption.
  variant?: TagsVariant;
}

export const Tags: FC<TagsProps> = ({ tags, tagId, variant = "pill" }) => {
  const className = variant === "stamp" ? `${ styles.tags } ${ styles.stamp }` : styles.tags;
  return (
    <section className={ className }>
      {
        tags
          .map( tag =>
            <TagComponent
              key={ tag.sys.id }
              tagName={ tag.sys.id }
              isTagged={ tagId == tag.sys.id }
            /> )
      }
    </section>
  );
};
