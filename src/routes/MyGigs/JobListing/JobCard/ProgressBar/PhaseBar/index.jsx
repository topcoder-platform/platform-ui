import React from "react";
import PT from "prop-types";
import PhasePoint from "../PhasePoint";
import PhasePointTooltip from "../../tooltips/PhasePointTooltip";

import "./styles.scss";

const PhaseBar = ({
  phase,
  passed,
  active,
  isFirstPhase,
  tooltipPosition,
  tooltipWidth,
}) => {
  return (
    <div
      styleName={`phase-bar ${passed || active ? "pass-active" : ""} ${
        isFirstPhase ? "isFirstPhase" : ""
      }`}
    >
      <div styleName="bar"></div>
      <PhasePointTooltip
        phase={phase}
        placement={tooltipPosition}
        width={tooltipWidth}
      >
        <div styleName="point">
          <PhasePoint text={phase} passed={passed} active={active} />
        </div>
      </PhasePointTooltip>
    </div>
  );
};

PhaseBar.propTypes = {
  phase: PT.string,
  passed: PT.bool,
  active: PT.bool,
  isFirstPhase: PT.bool,
  tooltipPosition: PT.string,
  tooltipWidth: PT.number,
};

export default PhaseBar;
