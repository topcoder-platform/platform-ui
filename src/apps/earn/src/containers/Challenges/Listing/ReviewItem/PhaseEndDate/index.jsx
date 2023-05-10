import PT from "prop-types";
import classNames from "classnames";
import * as utils from "@earn/utils";

import styles from "./styles.scss";

const PhaseEndDate = ({ challenge, tooltip }) => {
  const active = challenge.status === "Active";
  const endDate = utils.challenge.getEndDate(challenge);
  const phaseMessage =
    challenge.status === "Completed"
      ? ""
      : utils.challenge.getActivePhaseMessage(challenge);
  const hasStatusPhase = utils.challenge.getStatusPhase(challenge) != null;
  const phaseTimeLeft = utils.challenge.getActivePhaseTimeLeft(challenge);
  const timeLeftColor =
    phaseTimeLeft.time < 12 * 60 * 60 * 1000 ? "#EF476F" : "";
  const timeLeftMessage = phaseTimeLeft.late ? (
    <span>
      Late by
      <span
        style={{ color: "#EF476F" }}
        className={styles.uppercase}
      >{` ${phaseTimeLeft.text}`}</span>
    </span>
  ) : (
    <span style={{ color: timeLeftColor }}>
      <span
        className={typeof phaseTimeLeft.time === "number" && classNames(styles.uppercase)}
      >{`${phaseTimeLeft.text} `}</span>
      {phaseTimeLeft.late === false && <small>to go</small>}
    </span>
  );

  const Tooltip = tooltip;

  return (
    <span>
      <span className={styles['phase-message']}>
        {`${phaseMessage}`} {`${active ? "Ends" : "Ended"}`}:
      </span>{" "}
      <Tooltip>
        <span className={styles['time-left']}>
          {active && hasStatusPhase ? timeLeftMessage : endDate}
        </span>
      </Tooltip>
    </span>
  );
};

PhaseEndDate.defaultProps = {
  tooltip: ({ children }) => <>{children}</>,
};

PhaseEndDate.propTypes = {
  challenge: PT.shape(),
  tooltip: PT.oneOfType([PT.node, PT.func]),
};

export default PhaseEndDate;
