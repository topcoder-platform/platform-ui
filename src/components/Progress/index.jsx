/**
 * Onboard Progress
 *
 * Onboard Progress (level) Indicator
 */
import _ from "lodash";
import PT from "prop-types";
import React, { useState } from "react";
import cn from "classnames";

import ProgressDonutChart from "../../components/ProgressDonutChart";
import ProgressPopup from "../../components/ProgressPopup";
import config from "../../../config";
import { MAX_COMPLETED_STEP } from "../../constants";
import { PROGRESS_LEVELS as originalLevels } from "../../constants/products/WebsiteDesignLegacy";
import { setCookie, getCookie } from "../../autoSaveBeforeLogin";
import { ReactComponent as IconThreeDots} from "../../assets/images/icon-three-dots-vertical.svg";

import styles from "./styles.module.scss";

const Progress = ({ level, styleName, setStep, ...props }) => {
  const [progressPopupOpen, setProgressPopupOpen] = useState(false);
  let maxCompletedStep = getCookie(MAX_COMPLETED_STEP) || 0;
  if (
    _.isUndefined(maxCompletedStep) ||
    _.isNull(maxCompletedStep) ||
    parseInt(maxCompletedStep) < level
  ) {
    setCookie(MAX_COMPLETED_STEP, level, config.AUTO_SAVED_COOKIE_EXPIRED_IN);
    maxCompletedStep = level;
  }

  const levels = _.filter(originalLevels, (l) => l.visibleInProgressIndicator);

  const trueLevel = _.find(levels, (l) => l.trueIndex === level);

  return (
    <div className={cn(styles["onboard-progress"], !!styleName ? styles[styleName] : undefined)} {...props}>
      <div className={styles["level-container"]}>
        <div className={styles["level"]}>
          <span className={styles["level-num"]}>STEP {trueLevel.showIndex} </span>
          <span className={styles["muted"]}>/ {levels.length}</span>
        </div>
        <div>{trueLevel.label}</div>
      </div>
      <ProgressDonutChart
        className={styles["progress-donut-chart"]}
        progress={100 * (trueLevel.showIndex / levels.length)}
      />
      <div
        className={styles["progress-popup-toggle"]}
        onClick={(e) => setProgressPopupOpen((o) => !o)}
        role="tab"
        tabIndex={0}
      >
        <IconThreeDots />
      </div>
      <ProgressPopup
        setStep={setStep}
        level={trueLevel.trueIndex}
        maxStep={maxCompletedStep}
        levels={levels}
        open={progressPopupOpen}
        handleClose={(e) => setProgressPopupOpen(false)}
      />
    </div>
  );
};

Progress.propTypes = {
  level: PT.number,
};

export default Progress;
