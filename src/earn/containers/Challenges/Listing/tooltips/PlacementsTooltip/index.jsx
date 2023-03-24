import React from "react";
import PT from "prop-types";
import Tooltip from "../../../../../components/Tooltip";
import Prize from "./Prize";
import * as utils from "../../../../../utils";

import "./styles.scss";

const PlacementsTooltip = ({
  children,
  prizes,
  checkpointPrizes,
  currencySymbol,
  placement,
}) => {
  let numberOfCheckpointsPrizes;
  let topCheckPointPrize;
  if (checkpointPrizes && checkpointPrizes.length) {
    numberOfCheckpointsPrizes = checkpointPrizes.length;
    topCheckPointPrize = checkpointPrizes[0];
  }

  const Content = () => (
    <div styleName="prizes-tooltip">
      <ul styleName="placements">
        {prizes.map((prize, index) => (
          <li key={prize}>
            <Prize
              place={index + 1}
              prize={prize}
              currencySymbol={currencySymbol}
            />
          </li>
        ))}
      </ul>
      {checkpointPrizes && checkpointPrizes.length > 0 && (
        <p styleName="checkpoint-message">
          <strong>{numberOfCheckpointsPrizes}</strong> checkpoints awarded worth{" "}
          <strong>
            {utils.formatMoneyValue(topCheckPointPrize, currencySymbol)}
          </strong>{" "}
          each
        </p>
      )}
    </div>
  );

  return (
    <Tooltip placement={placement} overlay={<Content />}>
      {children}
    </Tooltip>
  );
};

PlacementsTooltip.propTypes = {};

export default PlacementsTooltip;
