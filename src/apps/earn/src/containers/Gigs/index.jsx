import { useEffect } from "react";
import { useSelector } from "react-redux";
import debounce from "lodash/debounce";

import store from "../../store";
import GigList from "../../components/gigs/GigList";
import GigListHeader from "../../components/gigs/GigListHeader";
import GigsPagination from "../../components/gigs/GigsPagination";
import ReferralBanner from "../../components/gigs/ReferralBanner";
import * as selectors from "../../reducers/gigs/selectors";
import * as effectors from "../../actions/gigs/effectors";
import { useUpdateEffect } from "../../utils/hooks";
import { setReferralCookie } from "../../utils/referral";

import styles from "./styles.scss";
import { LoadingSpinner } from "~/libs/ui";

/**
 * Loads featured and hotlist gigs and skills, updates state from query and
 * normalizes query. Then depending on if state has changed loads gigs page.
 */
const onMount = async () => {
  const mountLocation = {
    search: window.location.search,
    pathname: window.location.pathname,
  };
  setReferralCookie();
  const hasInitialData = selectors.getHasInitialData(store.getState());
  if (!hasInitialData) {
    await effectors.loadInitialData(store);
  }
  const stateOld = store.getState();
  const options = { mountLocation };
  effectors.updateStateAndQuery(store, options);
  if (stateOld === store.getState() && !hasInitialData) {
    // If after updating state from query the state stays the same we need to
    // manually load gigs. In other case gigs will be loaded by useUpdateEffect
    // (see below). But if we already have initial data we don't need to do it.
    effectors.loadGigsPage(store);
  }
};

/**
 * Loads gigs' page and updates URL query.
 */
const onUpdateParams = debounce(
  () => {
    effectors.loadGigsPage(store);
    effectors.updateUrlQuery(store);
  },
  1000,
  { leading: false }
);

/**
 * Displays content for Gigs listing page.
 *
 * @returns {JSX.Element}
 */
const Gigs = () => {
  const gigsError = useSelector(selectors.getGigsError);
  const hasGigs = useSelector(selectors.getHasGigs);
  const isLoadingPage = useSelector(selectors.getIsLoadingPage);
  const filters = useSelector(selectors.getFilters);
  const pageNumber = useSelector(selectors.getPageNumber);
  const pageSize = useSelector(selectors.getPageSize);
  const sorting = useSelector(selectors.getSorting);

  useEffect(() => {
    onMount();
  }, []);

  // Loads gigs when filters, pagination or sorting are updated.
  useUpdateEffect(onUpdateParams, [filters, pageNumber, pageSize, sorting]);

  return (
    <div className={styles["container"]}>
      <ReferralBanner className={styles["referralBanner"]} />
      <div className={styles["page-title"]}>Open Gigs</div>
      <div className={styles["gigs-list"]}>
        <GigListHeader />
        {isLoadingPage ? (
          <LoadingSpinner />
        ) : gigsError ? (
          <div className={styles["message error"]}>{gigsError}</div>
        ) : hasGigs ? (
          <GigList />
        ) : (
          <div className={styles["message"]}>No Gigs found.</div>
        )}
        <GigsPagination />
      </div>
    </div>
  );
};

export default Gigs;
