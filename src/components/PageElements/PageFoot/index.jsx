/**
 * PageFoot
 *
 * page bottom section
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageFoot = ({ children, align = "right", styleName, ...props }) => {
  return (
    <div
      styleName={cn("page-foot", `align-${align}`, styleName || "")}
      {...props}
    >
      {children}
    </div>
  );
};

PageFoot.propTypes = {
  children: PT.node,
};

export default PageFoot;
