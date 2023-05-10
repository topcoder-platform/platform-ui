/**
 * Deadlines panel.
 */

import moment from "moment-timezone";
import PT from "prop-types";

import { phaseEndDate, phaseStartDate } from "../../../../utils/challenge-listing/helper";
import Card from "./Card";
import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function DeadlinesPanel({ deadlines }) {
  let hasSubmissionPhase = false;

  const getCardProps = (deadline, index) => {
    let { name } = deadline;
    let showRange = true;
    name = name.replace(/\bCheckpoint\b/, 'Checkpoint');
    if (/.+submission/i.test(name)) {
      hasSubmissionPhase = true;
      name = name.replace(/submission/i, 'Submission');
    } else {
      switch (name) {
        case 'Submission':
          name = hasSubmissionPhase ? 'Final Submission' : 'Submission';
          break;
        case 'Review':
          name = hasSubmissionPhase ? 'Final Review' : name;
          break;
        case 'Appeals':
          name = hasSubmissionPhase ? 'Appeals Due' : name;
          break;
        default:
      }
    }
    if (index === deadlines.length - 1) {
      showRange = false;
    }

    const start = phaseStartDate(deadline);
    const end = phaseEndDate(deadline);

    return {
      name, start, end, showRange,
    };
  };

  return (
    <div className={styled("panel")} tabIndex="0" role="tabpanel">
      <p className={styled("timezone")}>
        Timezone:
        {moment.tz.guess()}
      </p>
      { deadlines.map((d, index) => {
        const {
          name, start, end, showRange,
        } = getCardProps(d, index);
        return (
          <Card
            key={d.name}
            title={name}
            start={start}
            end={end}
            showRange={showRange}
          />
        );
      })}
    </div>
  );
}

DeadlinesPanel.propTypes = {
  deadlines: PT.arrayOf(PT.shape({
    actualEndDate: PT.string,
    actualStartDate: PT.string,
    scheduledEndDate: PT.string,
    scheduledStartDate: PT.string,
  })).isRequired,
};
