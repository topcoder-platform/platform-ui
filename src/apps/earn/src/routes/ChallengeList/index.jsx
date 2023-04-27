/**
 * challenge listing app
 */
import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import Challenges from "../../containers/Challenges";
import Filter from "../../containers/Filter";
import { actions } from "../../actions";
import * as utils from "../../utils";
import store from "../../store";
import { initialChallengeFilter } from "../../reducers/filter";
import _ from "lodash";
import { initAuth } from '../../services/auth';
import { useMediaQuery } from "react-responsive";
import { useCssVariable } from "../../utils/hooks/useCssVariable";
import { ContentLayout } from "~/libs/ui";

import "react-date-range/dist/theme/default.css";
import "react-date-range/dist/styles.css";

import styles from './styles.scss';
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export const ChallengeList = () => {
  const location = useLocation();
  const previousControllerRef = useRef();

  function fetchChallenges() {
    const controller = new AbortController();
    const signal = controller.signal;
    if (previousControllerRef.current) {
      // abort the pending request
      previousControllerRef.current.abort();
    }
    previousControllerRef.current = controller;

    const challengesFilters = store.getState().filter.challenge;
    store.dispatch(actions.challenges.getChallengesInit());
    store.dispatch(actions.challenges.getChallengesDone(challengesFilters, signal));
  }

  useEffect(() => { initAuth() }, [])

  useEffect(() => {
    // if not search query params are in the url,
    // update url search params to match the store filters
    if (!location.search) {
      const currentFilter = store.getState().filter.challenge;
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

    // get filters from the url search params
    const params = utils.url.parseUrlQuery(location.search);
    const toUpdate = utils.challenge.createChallengeFilter(params);

    if (!toUpdate.types) toUpdate.types = [];
    if (!toUpdate.tracks) toUpdate.tracks = [];
    if (!toUpdate.bucket) toUpdate.bucket = "";

    // update store fitler if url has different filters
    const updatedFilter = { ...initialChallengeFilter, ...toUpdate };
    const currentFilter = store.getState().filter.challenge;
    const diff = !_.isEqual(updatedFilter, currentFilter);
    if (diff) {
      store.dispatch(actions.filter.updateFilter(updatedFilter));
    }

    fetchChallenges()
  }, [location]);

  useEffect(() => {
    let lastFilterState = store.getState().filter.challenge;
    const unsub = store.subscribe(() => {
      const currentFilter = store.getState().filter.challenge;

      if (_.isEqual(lastFilterState, currentFilter)) {
        return;
      }

      lastFilterState = currentFilter;
      fetchChallenges();
    })

    return () => unsub();
  }, [])

  // const onHideSidebar = () => {
  //   const sidebarEl = document.getElementById("sidebar-id");
  //   sidebarEl.classList.remove("show");
  // };

  const screenXs = useCssVariable("--mfe-screen-xs", (value) =>
    parseInt(value)
  );
  const isScreenXs = useMediaQuery({ maxWidth: screenXs });

  // useLayoutEffect(() => {
  //   showMenu(true);
  //   return () => {
  //     showMenu(false);
  //   };
  // }, [isScreenXs]);

  return (
  <ContentLayout>
      <div className={styled("layout")}>
        <aside className={styled("sidebar")} id="sidebar-id">
          <div className={styled("sidebar-content")}>
            {!isScreenXs && <div id="menu-id" />}
            <hr />
            <Filter />
          </div>
          <div className={styled("sidebar-footer")}>
            {/* <FeedbackButton /> */}
          </div>
          {/* <button
            type="button"
            className={styled("close-button")}
            onClick={onHideSidebar}
          >
            &times;
          </button> */}
        </aside>
        <div className={styled("content")}>
          <Challenges />
        </div>
      </div>
      <div id="tooltips-container-id" />
    </ContentLayout>
  );
};

