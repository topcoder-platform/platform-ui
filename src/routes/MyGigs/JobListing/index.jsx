import React, { useEffect, useRef, useState } from "react";
import PT from "prop-types";
import JobCard from "./JobCard";
import Button from "../../../components/Button";
import { useScrollLock } from "../../../utils/hooks";
import * as constants from "../../../constants";

import "./styles.scss";

const JobListing = ({ jobs, loadMore, total, numLoaded, gigStatus, page }) => {
  const scrollLock = useScrollLock();
  // const [page, setPage] = useState(1);

  const varsRef = useRef();
  varsRef.current = { scrollLock };

  const handleLoadMoreClick = () => {
    const nextPage = page + 1;
    scrollLock(true);
    // setPage(nextPage);
    loadMore(constants.GIGS_FILTER_STATUSES_PARAM[gigStatus], nextPage);
  };

  useEffect(() => {
    varsRef.current.scrollLock(false);
  }, [jobs]);

  // useEffect(() => {
  //   setPage(1);
  // }, [gigStatus]);
  return (
    <div styleName="card-container">
      {![
        constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS,
        constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS,
      ].includes(gigStatus) &&
        jobs.map((job, index) => (
          <div styleName="card-item" key={`${job.title}-${index}`}>
            <JobCard job={job} />
          </div>
        ))}

      {[
        constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS,
        constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS,
      ].includes(gigStatus) &&
        jobs
          .sort((a, b) => {
            if (a.sortPrio == b.sortPrio) {
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            }
            return a.sortPrio - b.sortPrio;
          })
          .map((job, index) => (
            <div styleName="card-item" key={`${job.title}-${index}`}>
              <JobCard job={job} />
            </div>
          ))}

      {numLoaded < total && page * constants.PER_PAGE < total && (
        <div styleName="load-more">
          <Button onClick={handleLoadMoreClick}>LOAD MORE</Button>
        </div>
      )}
    </div>
  );
};

JobListing.propTypes = {
  jobs: PT.arrayOf(PT.shape()),
  loadMore: PT.func,
  total: PT.number,
  numLoaded: PT.number,
  gigStatus: PT.string,
  page: PT.number,
};

export default JobListing;
