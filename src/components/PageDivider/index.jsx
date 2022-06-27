/**
 * PageDivider
 *
 * A Divider (line).
 */
import React, { useEffect } from "react";
import cn from "classnames";
import "./styles.module.scss";

const PageDivider = ({ styleName, ...props }) => {
  return <div styleName={cn("page-divider", styleName || "")} {...props}></div>;
};

export default PageDivider;
