import React from "react";
import PT from "prop-types";
import StarEmpty from "../../assets/images/icon-star-empty.svg";
import StarFilled from "../../assets/images/icon-star-filled.svg";
import "./styles.module.scss";

/**
 * Displays rating as stars.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const Rating = ({ className, rating }) => {
  const stars = [];
  for (let r = 1; r <= 5; r++) {
    stars.push(r <= rating ? <StarFilled /> : <StarEmpty />);
  }
  return (
    <div styleName="container" className={className}>
      {stars}
    </div>
  );
};

Rating.propTypes = {
  className: PT.string,
  rating: PT.number.isRequired,
};

export default Rating;
