import styles from "./styles.scss";
import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import store from "../../store";
import BasePage from "../BasePage";
import Gigs from "../Gigs";
import GigsFilter from "../GigsFilter";
import * as userSelectors from "../../reducers/gigs/user/selectors";
import * as userEffectors from "../../actions/gigs/user/effectors";

/**
 * Displays Gig listing page.
 *
 * @returns {JSX.Element}
 */
const GigsPage = () => {
  const isLoggedIn = useSelector(userSelectors.getIsLoggedIn);
  const gigsFilter = useMemo(() => <GigsFilter />, []);

  /*useEffect(() => {
    if (isLoggedIn) {
      return;
    } else {
      userEffectors.loadProfile(store);
    }
  }, [isLoggedIn]);*/

  return (
    <BasePage
      className={styles["page"]}
      contentClassName={styles["content"]}
      sidebarClassName={styles["sidebar"]}
      sidebarContent={gigsFilter}
      sidebarFooter={null}
    >
      <Gigs />
    </BasePage>
  );
};

export default GigsPage;
