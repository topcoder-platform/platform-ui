/**
 * A single deadline card.
 */
import PT from 'prop-types';
import moment from 'moment';

import { ReactComponent as CalendarIcon } from '@earn/assets/images/icon-calendar-2.svg';
import { ReactComponent as CalendarIconActive } from '@earn/assets/images/icon-calendar-2-active.svg';
import { ReactComponent as TimeIcon } from '@earn/assets/images/icon-time.svg';
import { ReactComponent as TimeIconActive } from '@earn/assets/images/icon-time-active.svg';
import { styled as styledCss } from "@earn/utils";

import styles from './style.scss';
const styled = styledCss(styles)

/* Date/time format to use in the card. */
const FORMAT_YEAR = 'MMM DD, YYYY';
const TIME = 'HH:mm';

export default function Card({
  title, start, end, showRange,
}) {
  const startMoment = moment(start);
  const endMoment = moment(end);
  const past = endMoment.isBefore(moment());
  return (
    <div className={styled(past ? "past" : "open")}>
      <p className={styled("title")}>{title}</p>
      <p styleName="sections">
        {showRange ? (
          <section styleName="section">
            <span styleName="section-title">Starts</span>
            <p className={styled("date")}>
              { past ? <CalendarIcon /> : <CalendarIconActive /> }
              <span>
                {startMoment.format(FORMAT_YEAR)}
              </span>
            </p>
            <p className={styled("time")}>
              { past ? <TimeIcon /> : <TimeIconActive /> }
              <span>
                {startMoment.format(TIME)}
              </span>
            </p>
          </section>
        ) : null}
        <section styleName="section">
          {showRange ? <span styleName="section-title">Ends</span> : null}
          <p styleName="date">
            { past ? <CalendarIcon /> : <CalendarIconActive /> }
            <span>
              {endMoment.format(FORMAT_YEAR)}
            </span>
          </p>
          <p styleName="time">
            { past ? <TimeIcon /> : <TimeIconActive /> }
            <span>
              {endMoment.format(TIME)}
            </span>
          </p>
        </section>
      </p>
    </div>
  );
}

Card.propTypes = {
  title: PT.string.isRequired,
  start: PT.string.isRequired,
  end: PT.string.isRequired,
  showRange: PT.bool.isRequired,
};
