import FilteredArchive from "@/components/FilteredArchive/FilteredArchive";
import { getCategoryStaticProps } from "@/components/FilteredArchive/getCategoryStaticProps";
import { CATEGORY_IDS } from "@/constants";


export const getStaticProps = getCategoryStaticProps;


export async function getStaticPaths() {
  return {
    paths: CATEGORY_IDS.map( slug => ({ params: { slug } }) ),
    fallback: false,
  };
}

export default FilteredArchive;
