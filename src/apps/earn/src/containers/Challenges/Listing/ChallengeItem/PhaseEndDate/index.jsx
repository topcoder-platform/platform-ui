import React from "react";
import PT from "prop-types";
import * as utils from "../../../../../utils";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

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
        className={styled("uppercase")}
      >{` ${phaseTimeLeft.text}`}</span>
    </span>
  ) : (
    <span style={{ color: timeLeftColor }}>
      <span
        className={styled(typeof phaseTimeLeft.time === "number" && "uppercase")}
      >{`${phaseTimeLeft.text} `}</span>
      {phaseTimeLeft.late === false && <small>to go</small>}
    </span>
  );

  const Tooltip = tooltip;

  return (
    <span>
      <span className={styled("phase-message")}>
        {`${phaseMessage}`} {`${active ? "Ends" : "Ended"}`}:
      </span>{" "}
      <Tooltip>
        <span className={styled("time-left")}>
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
