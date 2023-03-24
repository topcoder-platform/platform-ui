import React from "react";
import PT from "prop-types";

/**
 * Displays a flag with three dollar symbols.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const FlagDollars = ({ className, id }) => (
  <svg
    className={className}
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    x="0px"
    y="0px"
    viewBox="0 0 25 56"
    enableBackground="new 0 0 25 56"
    xmlSpace="preserve"
  >
    <linearGradient
      id={`flag-dollars-gradient-${id}`}
      gradientUnits="userSpaceOnUse"
      x1="-893.3536"
      y1="530.3744"
      x2="-893.3879"
      y2="531.4495"
      gradientTransform="matrix(23 0 0 -56 20560 29757)"
    >
      <stop offset="0" style={{ "stop-color": "#29B5C4" }} />
      <stop offset="1" style={{ "stop-color": "#42DDB9" }} />
    </linearGradient>
    <polygon
      fillRule="evenodd"
      clipRule="evenodd"
      fill={`url(#flag-dollars-gradient-${id})`}
      points="1,0 24,0 24,56 12.96,48.1909
	1,56 "
    />
    <text
      transform="matrix(6.123234e-17 -1 1 6.123234e-17 16.5 37.5)"
      fill="#2A2A2A"
      fontFamily="Roboto"
      fontSize="12px"
      fontWeight="500"
    >
      $$$
    </text>
  </svg>
);

FlagDollars.propTypes = {
  className: PT.string,
  id: PT.oneOfType([PT.number, PT.string]).isRequired,
};

export default FlagDollars;
