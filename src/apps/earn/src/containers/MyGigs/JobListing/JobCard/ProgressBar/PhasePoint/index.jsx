import React from "react";
import PT from "prop-types";
import { ReactComponent as IconCheck } from "../../../../../../assets/icons/checkpoint.svg";

import styles from "./styles.scss";

const PhasePoint = ({ text, passed, active }) => {
  return (
    <div className={[styles["phase-point"], passed ? styles["passed"] : "", 
        active ? styles["active"] : ""].join(" ")}
    >
      <div className={styles["checkmark"]}>
        <IconCheck className={styles["check"]} />
      </div>
      <span className={styles["text"]}>{text}</span>
    </div>
  );
};

PhasePoint.propTypes = {
  text: PT.string,
  passed: PT.bool,
  active: PT.bool,
};

export default PhasePoint;
