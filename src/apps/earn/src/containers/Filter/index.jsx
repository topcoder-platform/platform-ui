import React, { useEffect, useRef } from "react";
import PT from "prop-types";
import { connect } from "react-redux";
import ChallengeFilter from "./ChallengeFilter";
import actions from "../../actions";
import * as utils from "../../utils";

const Filter = ({
  bucket,
  types,
  tracks,
  tags,
  totalPrizesFrom,
  totalPrizesTo,
  recommended,
  events,
  groups,
  challengeBuckets,
  challengeTypes,
  challengeTracks,
  challengeTags,
  challengeSubCommunities,
  updateFilter,
  getTags,
  getSubCommunities,
  openForRegistrationCount,
  clearFilter,
  updateQuery,
}) => {
  const propsRef = useRef();
  propsRef.current = { getTags, getSubCommunities };

  useEffect(() => {
    propsRef.current.getTags();
    propsRef.current.getSubCommunities();
  }, []);

  return (
    <ChallengeFilter
      bucket={bucket}
      types={types}
      tracks={tracks}
      tags={tags}
      totalPrizesFrom={totalPrizesFrom}
      totalPrizesTo={totalPrizesTo}
      recommended={recommended}
      events={events}
      groups={groups}
      challengeBuckets={challengeBuckets}
      challengeTypes={challengeTypes}
      challengeTracks={challengeTracks}
      challengeTags={challengeTags}
      challengeSubCommunities={challengeSubCommunities}
      saveFilter={() => {}}
      clearFilter={() => {
        const filterChange = utils.challenge.createEmptyChallengeFilter();
        clearFilter(filterChange);
        updateQuery(filterChange);
      }}
      updateFilter={(filterChange) => {
        updateFilter(filterChange);
        updateQuery(filterChange);
      }}
      openForRegistrationCount={openForRegistrationCount}
    />
  );
};

Filter.propTypes = {
  bucket: PT.string,
  types: PT.arrayOf(PT.string),
  tracks: PT.arrayOf(PT.string),
  tags: PT.arrayOf(PT.string),
  totalPrizesFrom: PT.number,
  totalPrizesTo: PT.number,
  recommended: PT.bool,
  events: PT.arrayOf(PT.string),
  groups: PT.arrayOf(PT.string),
  challengeBuckets: PT.arrayOf(PT.string),
  challengeTypes: PT.arrayOf(PT.string),
  challengeTracks: PT.arrayOf(PT.string),
  challengeTags: PT.arrayOf(PT.string),
  challengeSubCommunities: PT.arrayOf(PT.shape()),
  updateFilter: PT.func,
  getTags: PT.func,
  getSubCommunities: PT.func,
  selectAllSubCommunities: PT.func,
  openForRegistrationCount: PT.number,
  clearFilter: PT.func,
  updateQuery: PT.func,
};

const mapStateToProps = (state) => ({
  state: state,
  bucket: state.filter.challenge.bucket,
  types: state.filter.challenge.types,
  tracks: state.filter.challenge.tracks,
  tags: state.filter.challenge.tags,
  totalPrizesFrom: state.filter.challenge.totalPrizesFrom,
  totalPrizesTo: state.filter.challenge.totalPrizesTo,
  recommended: state.filter.challenge.recommended,
  events: state.filter.challenge.events,
  groups: state.filter.challenge.groups,
  challengeBuckets: state.lookup.buckets,
  challengeTypes: state.lookup.types,
  challengeTracks: state.lookup.tracks,
  challengeTags: state.lookup.tags,
  challengeSubCommunities: state.lookup.subCommunities,
  openForRegistrationCount: state.challenges.openForRegistrationCount,
});

const mapDispatchToProps = {
  updateFilter: actions.filter.updateFilter,
  getTags: actions.lookup.getTagsDone,
  getSubCommunities: actions.lookup.getCommunityListDone,
  clearFilter: actions.filter.clearChallengeFilter,
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

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Filter);
