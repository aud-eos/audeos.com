import { PricePackage } from "@/lib/siteContent";
import { formatPrice } from "@/utils/formatPrice";
import { GEAR_ONLY_LABEL, WITH_ME_LABEL } from "@/constants";
import styles from "@/styles/Landing.module.scss";

export interface PriceListProps {
  packages: PricePackage[];
  showOperatedPrice: boolean;
}

export default function PriceList({ packages, showOperatedPrice }: PriceListProps ) {
  return (
    <ul className={ styles.priceList }>
      { packages.map( pricePackage => (
        <li key={ pricePackage.id } className={ styles.priceRow }>
          <div className={ styles.priceName }>
            <h3>{ pricePackage.name }</h3>
            { pricePackage.includes.length > 0 && (
              <ul className={ styles.includes }>
                { pricePackage.includes.map( item => <li key={ item }>{ item }</li> ) }
              </ul>
            ) }
          </div>
          <dl className={ styles.prices }>
            <div>
              { showOperatedPrice && <dt>{ GEAR_ONLY_LABEL }</dt> }
              <dd className={ styles.price }>{ formatPrice( pricePackage.price ) }</dd>
            </div>
            { showOperatedPrice && pricePackage.priceOperated !== null && (
              <div>
                <dt>{ WITH_ME_LABEL }</dt>
                <dd className={ styles.price }>{ formatPrice( pricePackage.priceOperated ) }</dd>
              </div>
            ) }
            <div className={ styles.unit }>{ pricePackage.priceUnit }</div>
          </dl>
        </li>
      ) ) }
    </ul>
  );
}
