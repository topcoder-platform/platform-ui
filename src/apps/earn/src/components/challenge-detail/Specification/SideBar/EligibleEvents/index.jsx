import PT from 'prop-types';

import { ReactComponent as Tco19LogoBlack } from '@earn/assets/images/tco19_logo_black.svg';

import { styled as styledCss } from "../../../../../utils";

import styles from "./style.scss";
const styled = styledCss(styles)

export default function EligibleEvents({ eventDetails }) {
  if (!eventDetails) return null;

  let content;
  switch (eventDetails.eventName) {
    case 'tco19': content = <Tco19LogoBlack />; break;
    default: content = eventDetails.description;
  }

  return (
    <div>
      <h3>ELIGIBLE EVENTS:</h3>
      <p className={styled("link-like-paragraph")}>
        {/* TODO: It is not good to compose the event URL like this, as
          * in general there is not guaranteed to be correct. */}
        <a
          target='_blank'
          rel='noopener noreferrer'
          href={`//${eventDetails.eventName}.topcoder.com`}
        >
          {content}
        </a>
      </p>
    </div>
  );
}

EligibleEvents.defaultProps = {
  eventDetails: null,
};

EligibleEvents.propTypes = {
  eventDetails: PT.shape({
    eventName: PT.string.isRequired,
    eventDetails: PT.string.isRequired,
    description: PT.string.isRequired,
  }),
};
