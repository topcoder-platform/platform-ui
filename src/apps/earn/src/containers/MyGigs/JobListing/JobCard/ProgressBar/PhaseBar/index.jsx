import PT from "prop-types";
import PhasePoint from "../PhasePoint";
import PhasePointTooltip from "../../tooltips/PhasePointTooltip";

import styles from "./styles.scss";

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
      className={[styles["phase-bar"], passed || active ? styles["pass-active"] : "", 
        isFirstPhase ? styles["isFirstPhase"] : ""].join(" ")}
    >
      <div className={styles["bar"]}></div>
      <PhasePointTooltip
        phase={phase}
        placement={tooltipPosition}
        width={tooltipWidth}
      >
        <div className={styles["point"]}>
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
