/**
 * Button
 *
 * Supports:
 * - size - see BUTTON_SIZE values
 * - type - see BUTTON_TYPE values
 *
 * If `routeTo` is set, then button works as React Router Link
 *
 * if `href` is set, then button is rendered as a link `<a>`
 */
import { Link } from "@reach/router";
import cn from "classnames";
import PT from "prop-types";
import React from "react";

import { BUTTON_SIZE, BUTTON_TYPE } from "../../constants";

import styles from "./styles.module.scss";

const Button = ({
  children,
  size = BUTTON_SIZE.SMALL,
  type = BUTTON_TYPE.PRIMARY,
  onClick,
  className,
  innerRef,
  disabled,
  routeTo,
  href,
  target,
  isSubmit,
}) => {
  if (href) {
    return (
      <a
        href={href}
        target={target}
        className={cn(styles["button"], styles[`type-${type}`], styles[`size-${size}`], className)}
        onClick={onClick}
        ref={innerRef}
      >
        {children}
      </a>
    );
  } else {
    const button = (
      <button
        className={cn(styles["button"], styles[`type-${type}`], styles[`size-${size}`], className)}
        onClick={onClick}
        ref={innerRef}
        disabled={disabled}
        type={isSubmit ? "submit" : "button"}
      >
        {children}
      </button>
    );

    return routeTo ? <Link to={routeTo}>{button}</Link> : button;
  }
};

Button.propTypes = {
  children: PT.node,
  size: PT.oneOf(Object.values(BUTTON_SIZE)),
  type: PT.oneOf(Object.values(BUTTON_TYPE)),
  onClick: PT.func,
  className: PT.string,
  innerRef: PT.func,
  disabled: PT.bool,
  routeTo: PT.string,
  href: PT.string,
  isSubmit: PT.bool,
};

export default Button;
