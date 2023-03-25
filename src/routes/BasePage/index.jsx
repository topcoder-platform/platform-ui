import styles from "./styles.scss";
import React, { useLayoutEffect } from "react";
import PT from "prop-types";

/**
 * Displays base Gigs page with the navigation menu in the sidebar.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const BasePage = ({
  children,
  className,
  contentClassName,
  sidebarClassName,
  sidebarContent,
  sidebarFooter,
}) => {

  return (
    <div className={styles["layout"]}>
      <aside className={styles["sidebar"]}>
        <div className={styles["sidebar-content"]}>
          <div id="menu-id" />
          {sidebarContent}
        </div>
        <div className={styles["sidebar-footer"]}>{sidebarFooter}</div>
      </aside>
      <div className={styles["content"]}>
        {children}
      </div>
    </div>
  );
};

BasePage.propTypes = {
  children: PT.node,
  className: PT.string,
  contentClassName: PT.string,
  sidebarClassName: PT.string,
  sidebarContent: PT.node,
  sidebarFooter: PT.node,
};

export default BasePage;
