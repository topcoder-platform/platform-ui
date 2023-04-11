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
import { Link } from "react-router-dom";
import cn from "classnames";
import PT from "prop-types";

import styles from "./styles.module.scss";

/**
 * Supported Button Sizes
 */
export const BUTTON_SIZE = {
  TINY: "tiny",
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

/**
 * Supported Button Types
 */
export const BUTTON_TYPE = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  WARNING: "warning",
  ROUNDED: "rounded",
};

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
