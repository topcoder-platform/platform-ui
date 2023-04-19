import PT from "prop-types";

import { Button } from "~/libs/ui";

import {
  MY_GIGS_STATUS_EMPTY_TEXT,
  GIGS_FILTER_STATUSES,
} from "../../../constants";
import styles from "./styles.scss";

const Empty = ({ gigStatus }) => {
  return (
    <div className={styles["empty-wrapper"]}>
      <div className={styles["empty-inner"]}>
        <h6>{MY_GIGS_STATUS_EMPTY_TEXT[gigStatus]}</h6>
        {gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS && (
          <span>Interested in getting a gig?</span>
        )}
        {gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS && (
          <Button
            primary
            size="md"
            to="/earn/gigs"
          >
            VIEW GIGS
          </Button>
        )}
      </div>
    </div>
  );
};

Empty.defaultProps = {
  gigStatus: GIGS_FILTER_STATUSES.OPEN_JOBS,
};

Empty.propTypes = {
  gigStatus: PT.string,
};

export default Empty;
