/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";
import PuffLoader from "react-spinners/PuffLoader";

const LoadingSpinner = ({ show = false, styleName }) => {
  return (
    <div
      styleName={cn("loading-spinner", show ? "show" : "hide", styleName || "")}
    >
      <PuffLoader color={"#2196f3"} loading={true} size={100} />
    </div>
  );
};

LoadingSpinner.propTypes = {
  show: PT.bool,
};

export default LoadingSpinner;
