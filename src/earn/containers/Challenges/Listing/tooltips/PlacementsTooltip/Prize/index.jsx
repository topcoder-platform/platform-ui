import React from "react";
import PT from "prop-types";
import * as utils from "../../../../../../utils";

import "./styles.scss";

const Prize = ({ place, prize, currencySymbol }) => (
  <div styleName={`prize medal place-${place > 3 ? "nth" : place}`}>
    <span
      styleName={`placement`}
      data-placement={
        place === 1 ? "ST" : place === 2 ? "ND" : place === 3 ? "RD" : "TH"
      }
    >
      {place}
    </span>
    <span styleName="value">
      {utils.formatMoneyValue(prize, currencySymbol)}
    </span>
  </div>
);

Prize.defaultProps = {
  place: 1,
};

Prize.propTypes = {};

export default Prize;
