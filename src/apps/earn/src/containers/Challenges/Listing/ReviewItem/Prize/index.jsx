import PT from "prop-types";
import * as utils from "@earn/utils";

import styles from "./styles.scss";

const Prize = ({ totalPrizes, currencySymbol }) => (
  <div className={styles.prize}>
    <span className={styles.text}>Purse</span>
    <span className={styles.value}>
      {utils.formatMoneyValue(totalPrizes, currencySymbol)}
    </span>
  </div>
);

Prize.propTypes = {
  totalPrizes: PT.number,
  currencySymbol: PT.string,
};

export default Prize;
