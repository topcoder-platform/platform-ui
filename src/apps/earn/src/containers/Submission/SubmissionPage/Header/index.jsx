/**
 * components.page.challenge-details.submission.header.index Header Component
 *
 * Description:
 *   Header for the submission page.  Displays title and allows navigation
 *   back to challenge details.
 */
import PT from 'prop-types';
import React from 'react';
import { Link } from 'react-router-dom';
import { ReactComponent as LeftArrow } from '@earn/assets/images/arrow-prev-green.svg';
import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
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
    <Link to={`${challengesUrl}/${challengeId}`} className={styled('header-link')}>
      <LeftArrow className={styled('left-arrow')} />
      <p>
        {title}
      </p>
    </Link>
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
