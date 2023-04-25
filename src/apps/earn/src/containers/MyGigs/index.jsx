import React, { useEffect, useRef, useState, useCallback } from "react";
import PT from "prop-types";
import { connect } from "react-redux";

import { LinkButton, Button } from "~/libs/ui";

import * as lookupSelectors from "../../reducers/lookupSelectors";
import * as myGigsSelectors from "../../reducers/my-gigs/selectors";
import Loading from "../../components/my-gigs/Loading";
import Empty from "../../components/my-gigs/Empty";
import store from "../../store";
import { GIGS_FILTER_STATUSES } from '../../constants';
import myGigs from "../../actions/my-gigs";
import lookup from "../../actions/lookup";

import JobListing from "./JobListing";
import UpdateGigProfile from "./modals/UpdateGigProfile";
import UpdateSuccess from "./modals/UpdateSuccess";

import styles from "./styles.scss";


const MyGigs = ({
  myActiveGigs,
  myOpenGigs,
  myCompletedGigs,
  myArchivedGigs,
  profile,
  getProfile,
  updateProfile,
  updateProfileSuccess,
  updateProfileReset,
  getAllCountries,
  checkingGigs,
  startCheckingGigs,
  gigStatus,
  loadingMyGigs,
  getMyActiveGigs,
  getMyOpenGigs,
  getMyCompletedGigs,
  getMyArchivedGigs,
}) => {
  const propsRef = useRef();
  propsRef.current = {
    getMyOpenGigs,
    getProfile,
    getAllCountries,
    startCheckingGigs,
  };

  useEffect(() => {
    const { getState } = store;
    let countryByCode = lookupSelectors.getCountryByCode(getState());
    if (!countryByCode) {
      propsRef.current.getAllCountries();
    }
    let isEmptyProfile = myGigsSelectors.isEmptyProfile(getState());
    if (isEmptyProfile) {
      propsRef.current.getProfile();
    }
  }, []);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!checkingGigs) {
      propsRef.current.getMyOpenGigs();
    }
  }, [checkingGigs]);

  const [openUpdateProfile, setOpenUpdateProfile] = useState(false);
  const [openUpdateSuccess, setOpenUpdateSuccess] = useState(false);
  const [currentGigs, setCurrentGigs] = useState({});

  useEffect(() => {
    if (gigStatus == GIGS_FILTER_STATUSES.ACTIVE_JOBS) {
      setCurrentGigs(myActiveGigs);
    }
    if (gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS) {
      setCurrentGigs(myOpenGigs);
    }
    if (gigStatus == GIGS_FILTER_STATUSES.COMPLETED_JOBS) {
      setCurrentGigs(myCompletedGigs);
    }
    if (gigStatus == GIGS_FILTER_STATUSES.ARCHIVED_JOBS) {
      setCurrentGigs(myArchivedGigs);
    }
  }, [gigStatus, myActiveGigs, myOpenGigs, myCompletedGigs, myArchivedGigs]);

  useEffect(() => {
    if (updateProfileSuccess) {
      setOpenUpdateSuccess(true);
      // in case of success, let's fetch the updated profile
      propsRef.current.getProfile();
    }
  }, [updateProfileSuccess]);

  const currentLoadMore = useCallback(
    (status, page) => {
      if (gigStatus == GIGS_FILTER_STATUSES.ACTIVE_JOBS) {
        getMyActiveGigs(status, page);
      }
      if (gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS) {
        getMyOpenGigs(status, page);
      }
      if (gigStatus == GIGS_FILTER_STATUSES.COMPLETED_JOBS) {
        getMyCompletedGigs(status, page);
      }
      if (gigStatus == GIGS_FILTER_STATUSES.ARCHIVED_JOBS) {
        getMyArchivedGigs(status, page);
      }
    },
    [
      gigStatus,
      getMyActiveGigs,
      getMyOpenGigs,
      getMyCompletedGigs,
      getMyArchivedGigs,
    ]
  );

  return (
    <>
      <div className={styles["page"]}>
        <h1 className={styles["title"]}>
          <span className={styles["text"]}>MY GIGS</span>
          <div className={styles["operation"]}>
            <Button
              primary
              size="lg"
              disabled={!(profile && profile.hasProfile)}
              onClick={() => setOpenUpdateProfile(true)}
              label="UPDATE GIG WORK PROFILE"
            />
            <LinkButton
              secondary
              size="lg"
              to="/earn/gigs"
              label="VIEW GIGS"
            />
          </div>
        </h1>
        {!checkingGigs &&
          !loadingMyGigs &&
          currentGigs.myGigs &&
          currentGigs.myGigs.length == 0 && <Empty gigStatus={gigStatus} />}
        {!checkingGigs &&
          currentGigs.myGigs &&
          currentGigs.myGigs.length > 0 && (
            <JobListing
              gigStatus={gigStatus}
              jobs={currentGigs.myGigs}
              loadMore={currentLoadMore}
              total={currentGigs.total}
              numLoaded={currentGigs.numLoaded}
              page={currentGigs.page}
            />
          )}
        {(checkingGigs || (loadingMyGigs && !currentGigs.myGigs)) && (
          <Loading>We are processing your gigs data</Loading>
        )}
      </div>
      <UpdateGigProfile
          open={openUpdateProfile}
          profile={profile}
          onSubmit={(profileEdit) => {
            updateProfile(profileEdit);
            setOpenUpdateProfile(false);
          }}
          onClose={() => {
            setOpenUpdateProfile(false);
          }}
      />
      <UpdateSuccess
          onClose={() => {
            setOpenUpdateSuccess(false);
            updateProfileReset();
          }}
          open={openUpdateSuccess}
      />
    </>
  );
};

MyGigs.propTypes = {
  gigStatus: PT.string,
  profile: PT.shape(),
  getProfile: PT.func,
  updateProfile: PT.func,
  updateProfileSuccess: PT.bool,
  getAllCountries: PT.func,
  checkingGigs: PT.bool,
  startCheckingGigs: PT.func,
  myActiveGigs: PT.shape(),
  myOpenGigs: PT.shape(),
  myCompletedGigs: PT.shape(),
  myArchivedGigs: PT.shape(),
  loadingMyGigs: PT.bool,
  getMyActiveGigs: PT.func,
  getMyOpenGigs: PT.func,
  getMyCompletedGigs: PT.func,
  getMyArchivedGigs: PT.func,
};

const mapStateToProps = (state) => ({
  gigStatus: state.filter.gig.status,
  checkingGigs: state.myGigs.checkingGigs,
  loadingMyGigs: state.myGigs.loadingMyGigs,
  myActiveGigs: state.myGigs[GIGS_FILTER_STATUSES.ACTIVE_JOBS],
  myOpenGigs: state.myGigs[GIGS_FILTER_STATUSES.OPEN_JOBS],
  myCompletedGigs: state.myGigs[GIGS_FILTER_STATUSES.COMPLETED_JOBS],
  myArchivedGigs: state.myGigs[GIGS_FILTER_STATUSES.ARCHIVED_JOBS],
  profile: state.myGigs.profile,
  updateProfileSuccess: state.myGigs.updatingProfileSuccess,
});

const mapDispatchToProps = {
  getMyActiveGigs: myGigs.getMyActiveGigs,
  getMyOpenGigs: myGigs.getMyOpenGigs,
  getMyCompletedGigs: myGigs.getMyCompletedGigs,
  getMyArchivedGigs: myGigs.getMyArchivedGigs,
  getProfile: myGigs.getProfile,
  updateProfile: myGigs.updateProfile,
  updateProfileReset: myGigs.updateProfileReset,
  getAllCountries: lookup.lookup.getAllCountries,
  startCheckingGigs: myGigs.startCheckingGigs,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGigs);
