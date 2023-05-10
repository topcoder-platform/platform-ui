/**
 * components.page.challenge-details.submission.header.index Header Component
 *
 * Description:
 *   Header for the submission page.  Displays title and allows navigation
 *   back to challenge details.
 */
import PT from 'prop-types';
import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
import { IconOutline, LinkButton } from '~/libs/ui';
const styled = styledCss(styles)

/**
  * Header shown on Submissions Page
  */
const Header = ({
  challengeId,
  challengesUrl,
  title,
}) => (
  <div className={styled('header')}>
    <div className={styled('header-link')}>
        <LinkButton
            secondary
            to={`${challengesUrl}/${challengeId}`}
            icon={IconOutline.ChevronLeftIcon}
            iconToLeft
        />
        <p>
            {title}
        </p>
    </div>
  </div>
);

/**
  * Prop Validation
  */
Header.propTypes = {
  challengeId: PT.string.isRequired,
  challengesUrl: PT.string.isRequired,
  title: PT.string.isRequired,
};

export default Header;
