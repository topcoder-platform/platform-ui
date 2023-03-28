/**
 * challenge listing app
 */
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import Challenges from "../../containers/Challenges";
// import Filter from "../../containers/Filter";
import { actions } from "@earn/actions";
import * as utils from "@earn/utils";
import store from "../../../store";
import { initialChallengeFilter } from "../../reducers/filter";
import _ from "lodash";
import { initAuth } from '../../services/auth';
// import { useMediaQuery } from "react-responsive";
// import { useCssVariable } from "@earn/utils/hooks/useCssVariable";

// import "react-date-range/dist/theme/default.css";
// import "react-date-range/dist/styles.css";
// import "rc-tooltip/assets/bootstrap.css";

export const ChallengeList = () => {
  const location = useLocation();
  const previousControllerRef = useRef();

  useEffect(() => {
    initAuth();
    
    if (!location.search) {
      const currentFilter = store.getState().earn.filter.challenge;
      const diff = !_.isEqual(initialChallengeFilter, currentFilter);

      if (diff) {
        const params = utils.challenge.createChallengeParams(currentFilter);
        utils.url.updateQuery(params, true);
      } else {
        store.dispatch(actions.challenges.getChallengesInit());
        store.dispatch(actions.challenges.getChallengesDone(currentFilter));
      }

      return;
    }

    let search = location.href.split("?").length
      ? "?" + location.href.split("?")[1]
      : "";
    const params = utils.url.parseUrlQuery(search);
    const toUpdate = utils.challenge.createChallengeFilter(params);

    if (!toUpdate.types) toUpdate.types = [];
    if (!toUpdate.tracks) toUpdate.tracks = [];
    if (!toUpdate.bucket) toUpdate.bucket = "";

    const updatedFilter = { ...initialChallengeFilter, ...toUpdate };
    const currentFilter = store.getState().filter.challenge;
    const diff = !_.isEqual(updatedFilter, currentFilter);
    if (diff) {
      store.dispatch(actions.filter.updateFilter(updatedFilter));
    }

    const controller = new AbortController();
    const signal = controller.signal;
    if (previousControllerRef.current) {
      // abort the pending request
      previousControllerRef.current.abort();
    }
    previousControllerRef.current = controller;

    store.dispatch(actions.challenges.getChallengesInit());
    store.dispatch(actions.challenges.getChallengesDone(updatedFilter, signal));
  }, [location]);

  // const onHideSidebar = () => {
  //   const sidebarEl = document.getElementById("sidebar-id");
  //   sidebarEl.classList.remove("show");
  // };

  // const screenXs = useCssVariable("--mfe-screen-xs", (value) =>
  //   parseInt(value)
  // );
  // const isScreenXs = useMediaQuery({ maxWidth: screenXs });

  // useLayoutEffect(() => {
  //   showMenu(true);
  //   return () => {
  //     showMenu(false);
  //   };
  // }, [isScreenXs]);

  return (
    <>
      <div className="layout">
        <aside className="sidebar" id="sidebar-id">
          <div className="sidebar-content">
            {/* {!isScreenXs && <div id="menu-id" />} */}
            <hr />
            {/* <Filter /> */}
          </div>
          <div className="sidebar-footer">
            {/* <FeedbackButton /> */}
          </div>
          {/* <button
            type="button"
            className="close-button"
            onClick={onHideSidebar}
          >
            &times;
          </button> */}
        </aside>
        <div className="content">
          <Challenges />
        </div>
      </div>
      <div id="tooltips-container-id" />
    </>
  );
};

