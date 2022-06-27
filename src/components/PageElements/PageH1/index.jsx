/**
 * PageH1
 *
 * page content heading 1
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageH1 = ({ children, styleName, ...props }) => {
  return (
    <h1 styleName={cn("page-h1", styleName || "")} {...props}>
      {children}
    </h1>
  );
};

PageH1.propTypes = {
  children: PT.node,
};

export default PageH1;
