/**
 * PageUl
 *
 * page content row (flex -> row)
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageRow = ({ children, half = false, styleName, ...props }) => {
  return (
    <div
      styleName={cn(
        "page-row",
        half ? "page-row-half" : "page-row-normal",
        styleName || ""
      )}
      {...props}
    >
      {children}
    </div>
  );
};

PageRow.propTypes = {
  children: PT.node,
  half: PT.bool,
};

export default PageRow;
