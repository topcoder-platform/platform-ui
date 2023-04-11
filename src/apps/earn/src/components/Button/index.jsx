import React from "react";
import PT from "prop-types";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const Button = ({ children, onClick, isPrimary, isText, size, disabled }) => (
  <button
    className={styled(`button ${isPrimary ? "button-primary" : ""} ${
      isText ? "button-text" : ""
    } ${size ? `button-${size}` : ""}`)}
    onClick={onClick}
    tabIndex={0}
    type="button"
    disabled={disabled}
  >
    {children}
  </button>
);

Button.defaultProps = {
  isPrimary: false,
  disabled: false,
};

Button.propTypes = {
  children: PT.node,
  onClick: PT.func,
  isPrimary: PT.bool,
};

export default Button;
