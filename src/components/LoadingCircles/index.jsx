import styles from "./styles.scss";
import React, { useLayoutEffect } from "react";
import PT from "prop-types";

const LoadingCircles = ({ className }) => (
  <svg className={[styles["container"], className].join(' ')} viewBox="0 0 64 64">
    <circle className={styles["circle-outer"]} cx="50%" cy="50%" r="0" />
    <circle className={styles["circle-inner"]} cx="50%" cy="50%" r="0" />
  </svg>
);

LoadingCircles.propTypes = {
  className: PT.string,
};

export default LoadingCircles;
