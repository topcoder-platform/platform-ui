/**
 * A single deadline card.
 */

import moment from "moment";
import PT from "prop-types";

import styles from "./style.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

/* Date/time format to use in the card. */
const FORMAT = "MMM DD, HH:mm";
const FORMAT_YEAR = "MMM DD YYYY, HH:mm";

export default function Card({ past, time, title }) {
  const time2 = moment(time);
  const past2 = past === null ? time2.isBefore(moment()) : past;
  return (
    <div className={styled(past2 ? "past" : "open")}>
      <p className={styled("title")}>{title}</p>
      <p className={styled("date")}>
        {time2.format(time2.year() !== moment().year() ? FORMAT_YEAR : FORMAT)}
      </p>
    </div>
  );
}

Card.defaultProps = {
  past: null,
};

Card.propTypes = {
  past: PT.bool,
  title: PT.string.isRequired,
  time: PT.string.isRequired,
};
