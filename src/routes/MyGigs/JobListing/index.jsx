import React, { useEffect, useRef, useState } from "react";
import PT from "prop-types";
import JobCard from "./JobCard";
import GigsButton from "../../../components/GigsButton";
import { useScrollLock } from "../../../utils/gigs/hooks";
import * as constants from "../../../constants";

import styles from "./styles.scss";

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

  return (
    <div className={styles["card-container"]}>
      {![
        constants.GIGS_FILTER_STATUSES.COMPLETED_JOBS,
        constants.GIGS_FILTER_STATUSES.ARCHIVED_JOBS,
      ].includes(gigStatus) &&
        jobs.map((job, index) => (
          <div className={styles["card-item"]} key={`${job.title}-${index}`}>
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
            <div className={styles["card-item"]} key={`${job.title}-${index}`}>
              <JobCard job={job} />
            </div>
          ))}

      {numLoaded < total && page * constants.PER_PAGE < total && (
        <div className={styles["load-more"]}>
          <GigsButton onClick={handleLoadMoreClick}>LOAD MORE</GigsButton>
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
