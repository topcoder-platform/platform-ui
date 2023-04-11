import * as utils from "../../../../../../utils";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const Prize = ({ place, prize, currencySymbol }) => (
  <div className={styled(`prize medal place-${place > 3 ? "nth" : place}`)}>
    <span
      className={styled(`placement`)}
      data-placement={
        place === 1 ? "ST" : place === 2 ? "ND" : place === 3 ? "RD" : "TH"
      }
    >
      {place}
    </span>
    <span className={styled("value")}>
      {utils.formatMoneyValue(prize, currencySymbol)}
    </span>
  </div>
);

Prize.defaultProps = {
  place: 1,
};

Prize.propTypes = {};

export default Prize;
