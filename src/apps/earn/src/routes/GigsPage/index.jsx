import  { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";

// TODO: Remove BasePage and replace with ContentLayout
import BasePage from "../../containers/BasePage";
import Gigs from "../../containers/Gigs";
import GigsFilter from "../../containers/GigsFilter";
import * as userSelectors from "../../reducers/user/selectors";
import * as userEffectors from "../../actions/user/effectors";
import store from "../../store";

import styles from "./styles.scss";

/**
 * Displays Gig listing page.
 *
 * @returns {JSX.Element}
 */
const GigsPage = () => {
  const isLoggedIn = useSelector(userSelectors.getIsLoggedIn);
  const gigsFilter = useMemo(() => <GigsFilter />, []);

  useEffect(() => {
    if (isLoggedIn) {
      return;
    } else {
      userEffectors.loadProfile(store);
    }
  }, [isLoggedIn]);

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
