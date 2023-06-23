import PT from "prop-types";

import { Tooltip } from "~/libs/ui";

import { JOB_STATUS_MESSAGE_MAPPER } from "../../../../../../constants";

import styles from "./styles.scss";

const PhasePointTooltip = ({ phase, children, placement, width }) => {
  const Content = () => (
    <div className={styles["phase-point-tooltip"]} style={{ width: `${width}px` }}>
      <h5 className={styles["title"]}>{phase}</h5>
      <p className={styles["text"]}>{JOB_STATUS_MESSAGE_MAPPER[phase]}</p>
    </div>
  );

  return (
    <Tooltip content={<Content />} place={placement}>
      {children}
    </Tooltip>
  );
};

PhasePointTooltip.defaultProps = {
  placement: "top",
};

PhasePointTooltip.propTypes = {
  phase: PT.string,
  children: PT.node,
  placement: PT.oneOf(["top", "bottom", "left", "right"]),
  width: PT.number,
};

export default PhasePointTooltip;
