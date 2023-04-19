import { useEffect, useRef, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import PT from "prop-types";

import { IconOutline, UiButton } from "~/libs/ui";

import { makeGigPath } from "../../../../utils/url";
import Ribbon from "../../../../components/my-gigs/Ribbon";
import {
    MY_GIG_PHASE_LABEL,
    MY_GIG_PHASE_ACTION,
    MY_GIGS_JOB_STATUS,
  PHASES_FOR_JOB_STATUS,
  MY_GIGS_STATUS_REMARK_TEXT,
} from "../../../../constants";
import { formatMoneyValue } from "../../../../utils";
import { getDateRange } from "../../../../utils/my-gig";
import { ReactComponent as IconNote } from "../../../../assets/icons/note.svg";
import { ReactComponent as IconInfo } from "../../../../assets/icons/ribbon-icon.svg";

import ProgressTooltip from "./tooltips/ProgressTooltip";
import NoteTooltip from "./tooltips/NoteTooltip";
import EarnTooltip from "./tooltips/EarnTooltip";
import ProgressBar from "./ProgressBar";
import styles from "./styles.scss";
import classNames from "classnames";

const JobCard = ({ job }) => {
  const [expanded, setExpanded] = useState(false);
  const [footerHeight, setFooterHeight] = useState(0);
  const footerRef = useRef({});
  const location = useLocation();

  useEffect(() => {
    setFooterHeight(footerRef.current.offsetHeight);
  }, []);

  useEffect(() => {
    setFooterHeight(footerRef.current.offsetHeight);
  }, [expanded]);

  const paymentInfo = useMemo(() => {
    if (job.paymentRangeFrom && job.paymentRangeTo && job.currency) {
      return `${job.currency}
        ${formatMoneyValue(job.paymentRangeFrom, "")}
        ${" - "}
        ${formatMoneyValue(job.paymentRangeTo, "")}
        ${" (USD)"}
        ${" / "}
        ${job.paymentRangeRateType}`;
    }
    return "";
  }, [
    job.paymentRangeFrom,
    job.paymentRangeTo,
    job.currency,
    job.paymentRangeRateType,
  ]);

  return (
    <div
      className={[styles["card"], styles["job-card"],
        job.label === MY_GIG_PHASE_LABEL.SELECTED ? styles["label-selected"] : "",
        job.label === MY_GIG_PHASE_LABEL.OFFERED ? styles["label-offered"] : "",
        job.label === MY_GIG_PHASE_LABEL.PLACED ? styles["label-placed"] : "",
        job.label === MY_GIG_PHASE_LABEL.WITHDRAWN ? styles["label-withdrawn"] : "",
        job.label === MY_GIG_PHASE_LABEL.COMPLETED ? styles["label-completed"] : "",
        job.label === MY_GIG_PHASE_LABEL.NOT_SELECTED ? styles["label-not-selected"] : ""].join(" ")}
    >
      <Link
        to={makeGigPath(job.jobExternalId)}
        state={{ from: location.pathname + location.search }}
      >
        <div className={[styles["card-header"], styles["job-card-header"]].join(" ")}>
          <div className={styles["ribbon"]}>
            <Ribbon
              text={job.label}
              tooltip={({ children }) => (
                <ProgressTooltip job={job}>{children}</ProgressTooltip>
              )}
            />
          </div>
        </div>
        <div className={styles["card-body"]}>
          <div className={styles["job-card-content"]}>
            <div className={styles["content"]}>
              <h4 className={styles["title"]}>{job.title}</h4>
              <ul className={styles["job-items"]}>
                <li>
                  <div className={styles["job-item"]}>
                    {MY_GIGS_JOB_STATUS.COMPLETED === job.status && (
                      <>
                        <div className={styles["caption"]}>Duration</div>
                        <div className={styles["text"]}>
                          {getDateRange(job.rbStartDate, job.rbEndDate)}
                        </div>
                      </>
                    )}
                    {MY_GIGS_JOB_STATUS.COMPLETED !== job.status && (
                      <>
                        <div className={styles["caption"]}>Payment Range</div>
                        <div className={styles["text"]}>{paymentInfo}</div>
                      </>
                    )}
                  </div>
                </li>
                <li>
                  <div className={styles["job-item"]}>
                    {MY_GIGS_JOB_STATUS.COMPLETED === job.status && (
                      <>
                        <div className={styles["caption"]}>
                          <span>Total Earnings</span>
                          <span className={styles["earn-tip"]}>
                            <EarnTooltip>
                              <IconInfo />
                            </EarnTooltip>
                          </span>
                        </div>
                        <div className={styles["text"]}>{`${job.currency}${job.paymentTotal}`}</div>
                      </>
                    )}
                    {MY_GIGS_JOB_STATUS.COMPLETED !== job.status && (
                      <>
                        <div className={styles["caption"]}>Location</div>
                        <div className={styles["text"]}>{job.location}</div>
                      </>
                    )}
                  </div>
                </li>
                {MY_GIGS_JOB_STATUS.COMPLETED !== job.status && (
                  <li>
                    <div className={styles["job-item"]}>
                      <div className={styles["caption"]}>Duration</div>
                      <div className={styles["text"]}>
                        {job.duration && `${job.duration} Weeks`}
                      </div>
                    </div>
                  </li>
                )}
                <li>
                  <div className={styles["job-item"]}>
                    <div className={styles["caption"]}>Hours</div>
                    <div className={styles["text"]}>
                      {job.hours && `${job.hours} hours / week`}
                    </div>
                  </div>
                </li>
                <li>
                  <div className={styles["job-item"]}>
                    <div className={styles["caption"]}>Working Hours</div>
                    <div className={styles["text"]}>
                      {job.workingHours && `${job.workingHours} hours`}
                    </div>
                  </div>
                </li>
              </ul>
            </div>
            <div
              className={classNames(
                styles["right-side"],
                styles["stand-by"],
                !job.phaseAction && styles["none"]
              )}
            >
              {job.phaseAction && <UiButton secondary size="lg" disabled>{job.phaseAction}</UiButton>}
            </div>
          </div>
        </div>
      </Link>
      <div className={[styles["card-footer"], styles["job-card-footer"]].join(" ")} ref={footerRef}>
        <div className={styles["note-container"]}>
          {(job.remark ||
            [
              MY_GIGS_JOB_STATUS.WITHDRAWN,
              MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN,
              MY_GIGS_JOB_STATUS.COMPLETED,
            ].includes(job.status)) && (
            <NoteTooltip>
              <i className={styles["icon"]}>
                <IconNote />
              </i>
            </NoteTooltip>
          )}
          <span className={styles["note"]}>
            {[
              MY_GIGS_JOB_STATUS.WITHDRAWN,
              MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN,
              MY_GIGS_JOB_STATUS.COMPLETED,
            ].includes(job.status)
              ? MY_GIGS_STATUS_REMARK_TEXT[job.status]
              : job.remark}
          </span>
          {![
            MY_GIGS_JOB_STATUS.JOB_CLOSED,
            MY_GIGS_JOB_STATUS.REJECTED_OTHER,
            MY_GIGS_JOB_STATUS.COMPLETED,
            MY_GIGS_JOB_STATUS.WITHDRAWN,
            MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN,
          ].includes(job.status) && (
            <span className={styles[`${expanded ? "show-less" : "show-more"}`]}>
              <UiButton
                link
                icon={IconOutline.ChevronDownIcon}
                iconToRight
                onClick={() => setExpanded(!expanded)}
                label={expanded ? "SHOW LESS" : "SHOW MORE"}
              />
            </span>
          )}
        </div>
        {![
          MY_GIGS_JOB_STATUS.JOB_CLOSED,
          MY_GIGS_JOB_STATUS.REJECTED_OTHER,
          MY_GIGS_JOB_STATUS.COMPLETED,
          MY_GIGS_JOB_STATUS.WITHDRAWN,
          MY_GIGS_JOB_STATUS.WITHDRAWN_PRESCREEN,
        ].includes(job.status) && (
          <div
          className={styles["progress-bar"]}
            style={{ display: expanded ? "" : "none" }}
          >
            <ProgressBar
              phases={PHASES_FOR_JOB_STATUS[job.status]}
              currentPhase={job.phase}
              currentPhaseStatus={job.phaseStatus}
              note={job.phaseNote}
            />
          </div>
        )}
      </div>
      <div className={styles["card-image"]} style={{ bottom: `${footerHeight}px` }} />
    </div>
  );
};

JobCard.propTypes = {
  job: PT.shape(),
};

export default JobCard;
