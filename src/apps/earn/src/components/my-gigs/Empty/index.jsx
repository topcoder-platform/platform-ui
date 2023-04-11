import PT from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  MY_GIGS_STATUS_EMPTY_TEXT,
  GIGS_FILTER_STATUSES,
} from "../../../constants";
import Button from "../../Button";
import styles from "./styles.scss";

const Empty = ({ gigStatus }) => {
  const navigate=useNavigate();
  return (
    <div className={styles["empty-wrapper"]}>
      <div className={styles["empty-inner"]}>
        <h6>{MY_GIGS_STATUS_EMPTY_TEXT[gigStatus]}</h6>
        {gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS && (
          <span>Interested in getting a gig?</span>
        )}
        {gigStatus == GIGS_FILTER_STATUSES.OPEN_JOBS && (
          <Button
            isPrimary
            size="large"
            onClick={() => {
              navigate("/earn/gigs");
            }}
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
