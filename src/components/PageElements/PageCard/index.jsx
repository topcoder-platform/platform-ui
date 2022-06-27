/**
 * PageCard
 *
 * page card
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageCard = ({
  colorStyle = "primary",
  hasImage = false,
  children,
  styleName,
  ...props
}) => {
  return (
    <div
      styleName={cn(
        "page-card",
        colorStyle === "primary" ? "color-primary" : "color-secondary",
        hasImage ? "has-image" : "",
        styleName || ""
      )}
      {...props}
    >
      {children}
    </div>
  );
};

PageCard.propTypes = {
  children: PT.node,
  hasImage: PT.bool,
};

export default PageCard;
