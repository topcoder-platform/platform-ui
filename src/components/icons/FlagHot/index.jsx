import React from "react";
import PT from "prop-types";

/**
 * Displays a flag with "HOT" text.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const FlagHot = ({ className, id }) => (
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
      id={`flag-hot-gradient-${id}`}
      gradientUnits="userSpaceOnUse"
      x1="-893.3696"
      y1="530.375"
      x2="-893.3696"
      y2="531.2072"
      gradientTransform="matrix(23 0 0 -56 20560 29757)"
    >
      <stop offset="0" style={{ "stop-color": "#B80A0A" }} />
      <stop offset="1" style={{ "stop-color": "#FF4560" }} />
    </linearGradient>
    <polygon
      fillRule="evenodd"
      clipRule="evenodd"
      fill={`url(#flag-hot-gradient-${id})`}
      points="1,0 24,0 24,56 12.96,48.1909
	1,56 "
    />
    <text
      transform="matrix(6.123234e-17 -1 1 6.123234e-17 16.5 35.5)"
      fill="#FFFFFF"
      fontFamily="Roboto"
      fontSize="12px"
      fontWeight="500"
    >
      HOT
    </text>
  </svg>
);

FlagHot.propTypes = {
  className: PT.string,
  id: PT.oneOfType([PT.number, PT.string]).isRequired,
};

export default FlagHot;
