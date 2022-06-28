/**
 * LoadingSpinner
 *
 * Centered Loading Spinner with back overlay
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";
import PuffLoader from "react-spinners/PuffLoader";

const LoadingSpinner = ({ show = false, styleName }) => {
  return (
    <div
      className={cn(
        styles["loading-spinner"],
        styles[show ? "show" : "hide"],
        !!styleName ? styles[styleName] : undefined
      )}
    >
      <PuffLoader color={"#2196f3"} loading={true} size={100} />
    </div>
  );
};

LoadingSpinner.propTypes = {
  show: PT.bool,
};

export default LoadingSpinner;
