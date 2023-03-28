import React, { useEffect, useState } from "react";
import PT from "prop-types";
import { connect } from "react-redux";
import actions from "@earn/actions";
// import ChallengeRecommendedError from "./Listing/errors/ChallengeRecommendedError";
import * as constants from "@earn/constants";
// import IconListView from "@earn/assets/icons/list-view.svg";
// import IconCardView from "@earn/assets/icons/card-view.svg";
// import { Banner } from "@earn/components/Banner";
import { get } from "lodash";

import * as utils from "@earn/utils";
// import { useMediaQuery } from "react-responsive";
import { useCssVariable } from "@earn/utils/hooks/useCssVariable";
import IconArrow from "../../../earn/assets/icons/arrow.svg";

import { useClickOutside } from "@earn/utils/hooks/useClickOutside";
import { LoadingSpinner } from "../../../../src-ts/lib";
import "./styles.module.scss";
// import { sn } from '../../utils/styleNames';

// const styleName = sn(styles);
// console.log({styles});
const Challenges = ({
  challenges,
  challengesMeta,
  search,
  page,
  perPage,
  sortBy,
  total,
  endDateStart,
  startDateEnd,
  updateFilter,
  bucket,
  recommended,
  recommendedChallenges,
  initialized,
  updateQuery,
  tags,
  loadingChallenges,
}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  useEffect(() => {
    const checkIsLoggedIn = async () => {
      setIsLoggedIn(await utils.auth.isLoggedIn());
    };
    checkIsLoggedIn();
  }, []);

  // reset pagination
  if (
    page > 1 &&
    challengesMeta.total &&
    challengesMeta.total > 0 &&
    challenges.length === 0
  ) {
    updateFilter({
      page: 1,
    });
    updateQuery({
      page: 1,
    });
  }

  const BUCKET_OPEN_FOR_REGISTRATION = constants.FILTER_BUCKETS[1];
  const isRecommended = recommended && bucket === BUCKET_OPEN_FOR_REGISTRATION;
  const sortByValue = isRecommended
    ? sortBy
    : sortBy === constants.CHALLENGE_SORT_BY_RECOMMENDED
    ? constants.CHALLENGE_SORT_BY_MOST_RECENT
    : sortBy;
  const sortByLabels = isRecommended
    ? Object.keys(constants.CHALLENGE_SORT_BY)
    : Object.keys(constants.CHALLENGE_SORT_BY).filter(
        (label) => label !== constants.CHALLENGE_SORT_BY_RECOMMENDED_LABEL
      );
  const noRecommendedChallenges =
    bucket === BUCKET_OPEN_FOR_REGISTRATION &&
    recommended &&
    recommendedChallenges.length === 0;

  const screenXs = useCssVariable("--mfe-screen-xs", (value) =>
    parseInt(value)
  );
  const isScreenXs = false; //useMediaQuery({ maxWidth: screenXs });

  const [menuExpanded, setMenuExpanded] = useState(false);
  const menuRef = useClickOutside(menuExpanded, (event) => {
    setMenuExpanded(false);
  });

  const mobileMenu = (
    <div
      id="menu-id"
      styleName={`mobile-menu ${menuExpanded ? "" : "hidden"}`}
    />
  );

  return (
    <div styleName='page'>
      {/* <Banner /> */}

      <div ref={menuRef}>
        <div
          styleName={`title ${isScreenXs && menuExpanded ? "menu-title" : ""}`}
          role="button"
          tabIndex={-1}
          onClick={() => isScreenXs && setMenuExpanded(!menuExpanded)}
        >
          <span>{isScreenXs && menuExpanded ? "EARN" : "CHALLENGES"}</span>

          {isScreenXs ? (
            <span styleName={`arrow-down ${menuExpanded ? "up" : ""}`}>
              <IconArrow />
            </span>
          ) : (
            <span styleName={'view-mode'}>
              {/*<button styleName="button-icon active">
                <IconListView />
              </button>
              <button styleName="button-icon">
                <IconCardView />
              </button>*/}
            </span>
          )}
        </div>

        {mobileMenu}
      </div>

      <LoadingSpinner hide={initialized} />
      
      {!!initialized && (
        <>
          {/*noRecommendedChallenges && <ChallengeRecommendedError />*/}
          listing
          {/* <Listing
            challenges={challenges}
            loadingChallenges={loadingChallenges}
            search={search}
            page={page}
            perPage={perPage}
            sortBy={sortByValue}
            total={total}
            endDateStart={endDateStart}
            startDateEnd={startDateEnd}
            updateFilter={(filterChange) => {
              updateFilter(filterChange);
              updateQuery(filterChange);
            }}
            bucket={bucket}
            tags={tags}
            sortByLabels={sortByLabels}
            isLoggedIn={isLoggedIn}
          /> */}
        </>
      )}
    </div>
  );
};

Challenges.propTypes = {
  challenges: PT.arrayOf(PT.shape()),
  search: PT.string,
  page: PT.number,
  perPage: PT.number,
  sortBy: PT.string,
  total: PT.number,
  endDateStart: PT.string,
  startDateEnd: PT.string,
  updateFilter: PT.func,
  bucket: PT.string,
  recommended: PT.bool,
  recommendedChallenges: PT.arrayOf(PT.shape()),
  initialized: PT.bool,
  updateQuery: PT.func,
  tags: PT.arrayOf(PT.string),
  loadingChallenges: PT.bool,
};

const mapStateToProps = ({earn: state}) => ({
  state: state,
  search: get(state, 'filter.challenge.search'),
  page: get(state, 'filter.challenge.page'),
  perPage: get(state, 'filter.challenge.perPage'),
  sortBy: get(state, 'filter.challenge.sortBy'),
  total: get(state, 'challenges.total'),
  endDateStart: get(state, 'filter.challenge.endDateStart'),
  startDateEnd: get(state, 'filter.challenge.startDateEnd'),
  challenges: get(state, 'challenges.challenges'),
  challengesMeta: get(state, 'challenges.challengesMeta'),
  bucket: get(state, 'filter.challenge.bucket'),
  recommended: get(state, 'filter.challenge.recommended'),
  recommendedChallenges: get(state, 'challenges.recommendedChallenges'),
  initialized: get(state, 'challenges.initialized'),
  tags: get(state, 'filter.challenge.tags'),
  loadingChallenges: get(state, 'challenges.loadingChallenges'),
});

const mapDispatchToProps = {
  updateFilter: actions.filter.updateFilter,
  updateQuery: actions.filter.updateChallengeQuery,
};

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
  updateQuery: (change) =>
    dispatchProps.updateQuery(
      {
        ...stateProps.state.filter.challenge,
        ...change,
      },
      change
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(Challenges);
