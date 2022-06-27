/**
 * LoadingIndicator
 *
 * Optionally shows error.
 */
import React from "react";
import _ from "lodash";
import PT from "prop-types";
import "./styles.module.scss";

const LoadingIndicator = ({ error }) => {
  return (
    <div styleName="loading-indicator">
      {!error
        ? "Loading..."
        : _.get(error, "response.data.message", error.toString())}
    </div>
  );
};

LoadingIndicator.propTypes = {
  error: PT.object,
};

export default LoadingIndicator;
