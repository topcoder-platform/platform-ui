import React from "react";
import PT from "prop-types";
import IconCheck from "assets/icons/checkpoint.svg";

import "./styles.scss";

const PhasePoint = ({ text, passed, active }) => {
  return (
    <div
      styleName={`phase-point ${passed ? "passed" : ""} ${
        active ? "active" : ""
      }`}
    >
      <div styleName="checkmark">
        <IconCheck styleName="check" />
      </div>
      <span styleName="text">{text}</span>
    </div>
  );
};

PhasePoint.propTypes = {
  text: PT.string,
  passed: PT.bool,
  active: PT.bool,
};

export default PhasePoint;
