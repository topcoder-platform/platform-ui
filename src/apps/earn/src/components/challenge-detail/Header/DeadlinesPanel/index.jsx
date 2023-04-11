/**
 * Deadlines panel.
 */

import moment from "moment-timezone";
import PT from "prop-types";

import { phaseEndDate, phaseStartDate } from "../../../../utils/challenge-listing/helper";
import Card from "./Card";
import styles from "./style.module.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function DeadlinesPanel({ deadlines }) {
  /* Calculates challenge start time. */
  let start = deadlines[0] || {};
  start = phaseStartDate(start);
  const started = moment(start).isBefore();

  return (
    <div className={styled("panel")} tabIndex="0" role="tabpanel">
      <p className={styled("timezone")}>
        Timezone:
        {moment.tz.guess()}
      </p>
      <Card
        past={started}
        time={start}
        title={started ? "Started" : "Starts"}
      />
      {deadlines.map((d, index) => (
        <Card
          key={d.name}
          time={phaseEndDate(d)}
          title={index === deadlines.length - 1 ? "Winners" : d.name}
        />
      ))}
    </div>
  );
}

DeadlinesPanel.propTypes = {
  deadlines: PT.arrayOf(
    PT.shape({
      actualEndDate: PT.string,
      actualStartDate: PT.string,
      scheduledEndDate: PT.string,
      scheduledStartDate: PT.string,
    })
  ).isRequired,
};
