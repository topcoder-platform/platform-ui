/**
 * PageUl
 *
 * page content row (flex -> row)
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import styles from "./styles.module.scss";

const PageRow = ({ children, half = false, className, ...props }) => {
  return (
    <div
      className={cn(
        styles["page-row"],
        styles[half ? "page-row-half" : "page-row-normal"],
        className,
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
