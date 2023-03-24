import React from "react";
import PT from "prop-types";
import * as utils from "../../../../../utils";

import "./styles.scss";

const Prize = ({ totalPrizes, currencySymbol }) => (
  <div styleName="prize">
    <span styleName="text">Purse</span>
    <span styleName="value">
      {utils.formatMoneyValue(totalPrizes, currencySymbol)}
    </span>
  </div>
);

Prize.propTypes = {
  totalPrizes: PT.number,
  currencySymbol: PT.string,
};

export default Prize;
