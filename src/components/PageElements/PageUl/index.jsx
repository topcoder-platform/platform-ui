/**
 * PageUl
 *
 * page content ul tag
 */
import React from "react";
import PT from "prop-types";
import cn from "classnames";
import "./styles.module.scss";

const PageUl = ({ children, styleName, ...props }) => {
  return (
    <ul styleName={cn("page-ul", styleName || "")} {...props}>
      {children}
    </ul>
  );
};

PageUl.propTypes = {
  children: PT.node,
};

export default PageUl;
