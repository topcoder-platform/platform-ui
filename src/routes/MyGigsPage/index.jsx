import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import BasePage from "../BasePage";
import MyGigsFilter from "../MyGigsFilter";
import MyGigs from "../MyGigs";
import * as constants from "../../constants";
import actions from "../../actions/gigs";
import * as utils from "../../utils/gigs";
import store from "../../store";
import { initialGigFilter } from "../../reducers/gigs/filter";
import _ from "lodash";

const MyGigsPage = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const getDataDebounced = useRef(_.debounce((f) => f(), 500));

  useEffect(() => {
    const checkIsLoggedIn = async () => {
      setIsLoggedIn(await utils.auth.isLoggedIn());
    };
    checkIsLoggedIn();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (!location.search) {
        store.dispatch(actions.filter.updateGigFilter(initialGigFilter));
        const cachedGigs = store.getState().myGigs[initialGigFilter.status];
        if (cachedGigs.myGigs && cachedGigs.myGigs.length !== 0) {
          return;
        }
        store.dispatch(
          actions.myGigs.getMyOpenGigs(
            constants.GIGS_FILTER_STATUSES_PARAM[initialGigFilter.status]
          )
        );
        return;
      }
      const params = utils.url.parseUrlQuery(location.search);
      if (_.keys(params).length == 1 && params.externalId) {
        store.dispatch(actions.myGigs.startCheckingGigs(params.externalId));
        return;
      }
      const s =
        _.values(constants.GIGS_FILTER_STATUSES).indexOf(params.status) >= 0
          ? params.status
          : null;
      const updatedGigFilter = {
        status: s || "Open Applications",
      };
      const currentGig = store.getState().filter.gig;
      const diff = !_.isEqual(updatedGigFilter, currentGig);
      if (diff) {
        store.dispatch(actions.filter.updateGigFilter(updatedGigFilter));
      }
      if (updatedGigFilter.status !== initialGigFilter.status) {
        // preload the open application first page data.
        const cachedOpenGigs = store.getState().myGigs[initialGigFilter.status];
        if (!cachedOpenGigs.myGigs) {
          store.dispatch(
            actions.myGigs.getMyOpenGigs(
              constants.GIGS_FILTER_STATUSES_PARAM[initialGigFilter.status]
            )
          );
        }
      }
      const cachedGigs = store.getState().myGigs[updatedGigFilter.status];
      if (cachedGigs.myGigs) {
        return;
      }
      getDataDebounced.current(() => {
        if (
          updatedGigFilter.status == constants.GIGS_FILTER_STATUSES.ACTIVE_JOBS
        ) {
          store.dispatch(
            actions.myGigs.getMyActiveGigs(
              constants.GIGS_FILTER_STATUSES_PARAM[updatedGigFilter.status]
            )
          );
        }
        if (
          updatedGigFilter.status == constants.GIGS_FILTER_STATUSES.OPEN_JOBS
        ) {
          store.dispatch(
            actions.myGigs.getMyOpenGigs(
              constants.GIGS_FILTER_STATUSES_PARAM[updatedGigFilter.status]
            )
          );
        }
        if (
          updatedGigFilter.status ==
          constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS
        ) {
          store.dispatch(
            actions.myGigs.getMyCompletedGigs(
              constants.GIGS_FILTER_STATUSES_PARAM[updatedGigFilter.status]
            )
          );
        }
        if (
          updatedGigFilter.status ==
          constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS
        ) {
          store.dispatch(
            actions.myGigs.getMyArchivedGigs(
              constants.GIGS_FILTER_STATUSES_PARAM[updatedGigFilter.status]
            )
          );
        }
      });
    }
  }, [location, isLoggedIn]);

  const myGigsFilter = useMemo(() => (isLoggedIn ? <MyGigsFilter /> : null), [
    isLoggedIn,
  ]);

  return (
    <BasePage sidebarContent={myGigsFilter} >
      <MyGigs />
    </BasePage>
  );
};

export default MyGigsPage;
