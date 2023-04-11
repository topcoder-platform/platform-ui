import React from "react";
import PT from "prop-types";
import Tooltip from "../../../../../../components/Tooltip";
import { ReactComponent as IconCheck } from "../../../../../../assets/icons/checkpoint-small.svg";

import styles from "./styles.scss";

const ProgressTooltip = ({ job, children }) => {
  const Content = () => (
    <div className={styles["progress-tooltip"]}>
      <div className={styles["progress-tooltip-content"]}>
        <div
          className={[styles["progress-phase"], styles["pre-previous"],
                    !job.previous ? styles["hidden"] : ""].join(" ")}
        >
          <span className={[styles["indicator"], !job.next ? styles["hidden"] : ""].join(" ")}>
            <i className={styles["before"]}>
              <IconCheck />
            </i>
            <i className={styles["after"]} />
          </span>
        </div>
        <div
          className={[styles["progress-phase"], styles["previous"], 
                    !job.previous ? styles["hidden"] : "",
                    job.next ? styles["has-next"] : ""].join(" ")}
        >
          <span className={[styles["indicator"], !job.next ? styles["hidden"] : ""].join(" ")}>
            <i className={styles["before"]}>
              <IconCheck />
            </i>
            <i className={styles["after"]}/>
          </span>
          <h5 className={styles["name"]}>{job.previous}</h5>
          <p className={styles["note"]}>{job.previousNote}</p>
        </div>
        <div className={[styles["progress-phase"], styles["next"], 
                        !job.next ? styles["hidden"] : ""].join(" ")}>
          <span className={styles["indicator"]}>
            <i className={styles["before"]}>
              <IconCheck />
            </i>
            <i className={styles["after"]}/>
          </span>
          <h5 className={styles["name"]}>NEXT: {job.next}</h5>
          <p className={styles["note"]}>{job.nextNote}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Tooltip overlay={<Content />} placement="bottom">
      {children}
    </Tooltip>
  );
};

ProgressTooltip.propTypes = {
  job: PT.shape(),
  children: PT.node,
};

export default ProgressTooltip;
