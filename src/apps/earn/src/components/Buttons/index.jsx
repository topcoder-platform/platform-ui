import React from "react";
import PT from "prop-types";
import _ from "lodash";
import { themr } from "react-css-super-themr";
import { Link as RouterLink } from "react-router-dom";
import dangerTheme from "./themes/danger.scss";
import defaultTheme from "./themes/default.scss";
import ghostTheme from "./themes/ghost.scss";
import primaryTheme from "./themes/primary.scss";
import secondaryTheme from "./themes/secondary.scss";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const Link = (props) => {
  const {
    children,
    className,
    enforceA,
    onClick,
    onMouseDown,
    openNewTab,
    replace,
    to,
  } = props;
  /* Renders Link as <a> element if:
   * - It is opted explicitely by `enforceA` prop;
   * - It should be opened in a new tab;
   * - It is an absolte URL (starts with http:// or https://);
   * - It is anchor link (starts with #). */
  if (enforceA || openNewTab || to.match(/^(#|https?:\/\/)/)) {
    return (
      <a
        className={className}
        href={to}
        onClick={onClick}
        onMouseDown={onMouseDown}
        rel="noopener noreferrer"
        target={openNewTab ? "_blank" : ""}
      >
        {children}
      </a>
    );
  }

  const linkProps = _.omit(props, ["children", "enforceA", "openNewTab"]);

  /* Otherwise we render the link as React Router's Link or NavLink element. */
  return React.createElement(
    RouterLink,
    {
      ...linkProps,
      replace,
      onClick: (e) => {
        /* If a custom onClick(..) handler was provided we execute it. */
        if (onClick) onClick(e);

        /* The link to the current page will scroll to the top of the page. */
        window.scroll(0, 0);
      },
    },
    children
  );
};

Link.defaultProps = {
  children: null,
  className: null,
  enforceA: false,
  onClick: null,
  onMouseDown: null,
  openNewTab: false,
  replace: false,
  to: "",
};

Link.propTypes = {
  children: PT.node,
  className: PT.string,
  enforceA: PT.bool,
  onClick: PT.func,
  onMouseDown: PT.func,
  openNewTab: PT.bool,
  replace: PT.bool,
  to: PT.oneOfType([PT.object, PT.string]),
};

const ButtonComponent = ({
  active,
  children,
  disabled,
  enforceA,
  onClick,
  onMouseDown,
  openNewTab,
  replace,
  size,
  theme,
  to,
  type,
}) => {
  let className = theme.button;
  if (theme[size]) className += ` ${theme[size]}`;
  if (active && theme.active) className += ` ${theme.active}`;
  if (disabled) {
    if (theme.disabled) className += ` ${theme.disabled}`;
    return <div className={className}>{children}</div>;
  }
  if (to) {
    if (theme.link) className += ` ${theme.link}`;
    return (
      <Link
        className={className}
        enforceA={enforceA}
        onClick={onClick}
        onMouseDown={onMouseDown}
        openNewTab={openNewTab}
        replace={replace}
        to={to}
      >
        {children}
      </Link>
    );
  }

  if (theme.regular) {
    className += ` ${theme.regular}`;
  }

  return (
    <button
      className={className}
      onClick={onClick}
      onMouseDown={onMouseDown}
      type={type}
    >
      {children}
    </button>
  );
};

ButtonComponent.defaultProps = {
  active: false,
  children: null,
  disabled: false,
  enforceA: false,
  onClick: null,
  onMouseDown: null,
  openNewTab: false,
  replace: false,
  size: null,
  to: null,
  type: "button",
};

ButtonComponent.propTypes = {
  active: PT.bool,
  children: PT.node,
  disabled: PT.bool,
  enforceA: PT.bool,
  onClick: PT.func,
  onMouseDown: PT.func,
  openNewTab: PT.bool,
  replace: PT.bool,
  size: PT.string,
  theme: PT.shape({
    button: PT.string.isRequired,
    disabled: PT.string,
    link: PT.string,
    regular: PT.string,
  }).isRequired,
  to: PT.oneOfType([PT.object, PT.string]),
  type: PT.oneOf(["button", "reset", "submit"]),
};

export const DefaultButton = themr(
  "DefaultButton",
  defaultTheme
)(ButtonComponent);
export const DangerButton = themr("DangerButton", dangerTheme)(ButtonComponent);
export const GhostButton = themr("GhostButton", ghostTheme)(ButtonComponent);
export const PrimaryButton = themr(
  "PrimaryButton",
  primaryTheme
)(ButtonComponent);
export const SecondaryButton = themr(
  "SecondaryButton",
  secondaryTheme
)(ButtonComponent);

const Button = ({ children, className, onClick }) => {
  return (
    <button
      className={styled(`tc-btn ${className} buttons-default`)}
      onClick={() => onClick()}
      type="button"
    >
      {children}
    </button>
  );
};

Button.defaultProps = {
  className: "tc-blue-btn",
  onClick: _.noop,
  children: null,
};

Button.propTypes = {
  className: PT.string,
  onClick: PT.func,
  children: PT.node,
};

export default Button;
