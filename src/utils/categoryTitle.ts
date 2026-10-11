import categoriesData from "../../data/categories.json";
import { CategoryConfigMap } from "@/types/categoryConfig";

const CATEGORY_CONFIG: CategoryConfigMap = categoriesData satisfies CategoryConfigMap;

export function categoryTitleFor( categoryId: string | undefined ): string {
  const config = categoryId ? CATEGORY_CONFIG[categoryId] : undefined;
  if( !config ) {
    throw new Error( `categoryTitleFor: no category config for "${categoryId}"` );
  }
  return config.title;
}
