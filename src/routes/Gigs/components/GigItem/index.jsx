import styles from "./styles.scss";
import React, { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import PT from "prop-types";
import cn from "classnames";
import TagList from "../../../../components/TagList";
import IconFlagDollars from "../../../../components/icons/FlagDollars";
import IconFlagHot from "../../../../components/icons/FlagHot";
import IconFlagNew from "../../../../components/icons/FlagNew";
import { formatPaymentAmount } from "../../../../utils/gigs/gigs/formatting";
import { formatPlural } from "../../../../utils/gigs/formatting";
import { makeGigPath } from "../../../../utils/gigs/url";

/**
 * Displays gigs list item.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const GigItem = ({ className, gig, onClickSkill }) => {
  const {
    duration,
    id,
    isGlobal,
    jobExternalId,
    jobTag,
    location,
    payment,
    skills,
    title,
  } = gig;

  const browserLocation = useLocation();

  return (
    <Link
      className={[styles.container, className].join(' ')}
      to={makeGigPath(jobExternalId)}
      state={{ from: browserLocation.pathname + browserLocation.search }}
    >
      {jobTag === "$$$" && (
        <IconFlagDollars className={styles.flagIcon} id={id} />
      )}
      {jobTag === "Hot" && <IconFlagHot className={styles.flagIcon} id={id} />}
      {jobTag === "New" && <IconFlagNew className={styles.flagIcon} id={id} />}
      <div className={styles["name-skills"]}>
        <div className={styles["name"]}>{title}</div>
        <div className={[styles.location, isGlobal ? styles.global : null ].join(' ')}>{location}</div>
        {!!skills?.length && (
          <div className={styles["skills"]}>
            <TagList
              maxTagCount={3}
              onClickTag={onClickSkill}
              renderTag={renderTag}
              tags={skills}
            />
          </div>
        )}
      </div>
      <div className={styles["payment"]}>
        <div className={styles["payment-range"]}>
          {formatPaymentAmount(payment?.min, payment?.max, payment?.currency)}
        </div>
        <div className={styles["payment-label"]}>
          {payment?.frequency || "weekly"} payment
        </div>
      </div>
      <div className={styles["duration"]}>
        <div className={styles["duration-weeks"]}>
          {duration ? formatPlural(duration, "Week") : "-"}
        </div>
        <div className={styles["duration-label"]}>Duration</div>
      </div>
    </Link>
  );
};

GigItem.propType = {
  className: PT.string,
  gig: PT.shape({
    duration: PT.number,
    id: PT.string.isRequired,
    isGlobal: PT.bool,
    location: PT.string.isRequired,
    payment: PT.shape({
      frequency: PT.string,
      max: PT.number,
      min: PT.number,
    }),
    skills: PT.arrayOf(
      PT.shape({
        id: PT.string.isRequired,
        name: PT.string.isRequired,
      })
    ),
    title: PT.string.isRequired,
  }).isRequired,
  onClickSkill: PT.func.isRequired,
};

export default GigItem;

const renderTag = ({ className, onClickTag, tag: { id, name } }) => (
  <span
    key={id}
    data-id={id}
    onClick={onClickTag}
    className={[styles["skill"], className].join(' ')}
    tabIndex={0}
  >
    {name}
  </span>
);
