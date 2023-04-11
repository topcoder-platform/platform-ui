import React from "react";
import PT from "prop-types";

import styles from"./styles.scss";

/**
 * Displays a button.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const GigsButton = ({
  children,
  className,
  onClick,
  isInverted,
  isPrimary,
  isSelected,
  isText,
  shade,
  size,
  buttonStyle,
  disabled,
  value,
}) => (
  <button
    data-value={value}
    className={[className,  styles["button"], buttonStyle ? styles[`button-${buttonStyle}`] : "", 
              isPrimary ? styles["button-primary"] : "",
              isInverted ? styles["button-inverted"] : "",
              shade ? styles[`button-${shade}`] : "",
              isText ? styles["button-text"] : "",
              size ? styles[`button-${size}`] : "",
              isSelected ? styles["is-selected"] : ""].join(" ")}
    onClick={onClick}
    tabIndex={0}
    type="button"
    disabled={disabled}
  >
    {children}
  </button>
);

GigsButton.defaultProps = {
  isInverted: false,
  isPrimary: false,
  disabled: false,
};

GigsButton.propTypes = {
  children: PT.node,
  className: PT.string,
  onClick: PT.func,
  isInverted: PT.bool,
  isPrimary: PT.bool,
  isSelected: PT.bool,
  isText: PT.bool,
  shade: PT.oneOf(["dark"]),
  size: PT.string,
  buttonStyle: PT.oneOf(["circle"]),
  value: PT.any,
};

export default GigsButton;
