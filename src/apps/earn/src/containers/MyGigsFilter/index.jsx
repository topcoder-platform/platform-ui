import React from "react";
import PT from "prop-types";
import { connect } from "react-redux";
import GigsFilter from "./GigsFilter";
import actions from "../../actions";
import { updateQuery } from "../../utils/url";
import * as constants from "../../constants";

const MyGigsFilter = ({
  gigStatus,
  gigsStatuses,
  updateGigFilter,
  openJobsCount,
}) => (
  <GigsFilter
    gigStatus={gigStatus}
    gigsStatuses={gigsStatuses}
    openJobsCount={openJobsCount}
    updateGigFilter={(gigFilterChanged) => {
      updateGigFilter(gigFilterChanged);
      updateQuery(gigFilterChanged);
    }}
  />
);

MyGigsFilter.propTypes = {
  gigStatus: PT.string,
  gigsStatuses: PT.arrayOf(PT.string),
  updateGigFilter: PT.func,
  openJobsCount: PT.number,
};

const mapStateToProps = (state) => ({
  state: state,
  gigStatus: state.filter.gig.status,
  openJobsCount: state.myGigs[constants.GIGS_FILTER_STATUSES.OPEN_JOBS].total,
  gigsStatuses: state.lookup.gigsStatuses,
});

const mapDispatchToProps = {
  updateGigFilter: actions.filter.updateGigFilter,
  updateGigQuery: actions.filter.updateGigQuery,
};

const mergeProps = (stateProps, dispatchProps, ownProps) => ({
  ...ownProps,
  ...stateProps,
  ...dispatchProps,
  updateQuery: (change) =>
    dispatchProps.updateGigQuery(
      {
        ...stateProps.state.filter.gig,
        ...change,
      },
      change
    ),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(MyGigsFilter);
