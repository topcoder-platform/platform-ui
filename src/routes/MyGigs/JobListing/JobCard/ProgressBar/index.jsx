import React from "react";
import PT from "prop-types";
import PhaseBar from "./PhaseBar";
import * as utils from "../../../../../utils/gigs";
import * as constants from "../../../../../constants";

import styles from "./styles.scss";

const ProgressBar = ({ phases, currentPhase, currentPhaseStatus, note }) => {
  const isPassed = (phase) =>
    utils.myGig.isPassedPhase(phases, currentPhase, phase) ||
    (phase === currentPhase && utils.myGig.isLastPhase(phase)) ||
    (phase === currentPhase &&
      currentPhaseStatus === constants.MY_GIG_PHASE_STATUS.PASSED);
  const isFirst = (phase) => utils.myGig.isFirstPhase(phase);
  const isActive = (phase) =>
    phase === currentPhase &&
    currentPhaseStatus === constants.MY_GIG_PHASE_STATUS.ACTIVE;

  return (
    <div className={styles["progress"]}>
      <div className={styles["progress-bar-wrapper"]}>
        <div className={styles["progress-bar"]}>
          {(phases || []).map((phase, index) => (
            <PhaseBar
              key={phase}
              phase={phase}
              passed={isPassed(phase)}
              active={isActive(phase)}
              isFirstPhase={isFirst(phase)}
              tooltipPosition={index === 1 || index === 4 ? "bottom" : "top"}
              tooltipWidth={
                index === 2 || index === 5 ? 160 : index === 6 ? 180 : 190
              }
            />
          ))}
        </div>
      </div>
      <p className={styles["progress-note"]}>{note}</p>
    </div>
  );
};

ProgressBar.propTypes = {
  phases: PT.arrayOf(PT.string),
  currentPhase: PT.string,
  currentPhaseStatus: PT.string,
  note: PT.string,
};

export default ProgressBar;
