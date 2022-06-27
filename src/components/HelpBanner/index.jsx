/**
 * Help Banner component
 */
import React, { useState } from "react";
import cn from "classnames";
import ArrowIcon from "../../assets/images/icon-arrow.svg";
import "./styles.module.scss";
import Button from "../Button";

const HelpBanner = ({
  title,
  description,
  contactSupport,
  children,
  styles = [],
  defaultOpen = false,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div styleName={cn("banner", ...styles)}>
      <div
        styleName="title"
        onClick={() => setOpen(!open)}
        role="button"
        tabIndex={0}
      >
        <span>{title}</span>

        <div styleName={cn("arrowIcon", open ? "up" : null)}>
          <ArrowIcon />
        </div>
      </div>

      {open && title !== description && (
        <p styleName="description">{description}</p>
      )}
      {open && children && <p styleName="description">{children}</p>}
      {open && contactSupport && (
        <p styleName="supportButton">
          <Button onClick={contactSupport}>Contact support</Button>
        </p>
      )}
    </div>
  );
};

export default HelpBanner;
