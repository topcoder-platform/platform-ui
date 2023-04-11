import { Link } from "react-router-dom";
import PT from "prop-types";
import _ from "lodash";

import { CHALLENGES_URL } from "~/apps/earn/src/constants";
import { toBreakableWords } from "~/apps/earn/src/utils";

import TagsMoreTooltip from "../tooltips/TagsMoreTooltip";

import TrackIcon from "./TrackIcon";
import NumRegistrants from "./NumRegistrants";
import NumSubmissions from "./NumSubmissions";
import Tags from "./Tags";
import styles from "./styles.scss";

const ReviewItem = ({ challenge, onClickTag, onClickTrack, isLoggedIn }) => {
  let submissionLink = `${CHALLENGES_URL}/${challenge.id}`;
  let applyLink = `${CHALLENGES_URL}/${challenge.id}/review-opportunities`;
  if (isLoggedIn && challenge.numOfSubmissions > 0) {
    submissionLink += "?tab=submissions";
  }

  const challengeName = toBreakableWords(challenge.name, (w) =>
    w.length > 20 ? `<span style="word-break: break-all">${w}</span>` : w
  );

  return (
    <div className={styles['challenge-item']}>
      <div className={styles.track}>
        <TrackIcon
          track={challenge.track}
          type={challenge.type}
          tcoEligible={_.get(challenge, "events[0].key")}
          onClick={onClickTrack}
        />
      </div>
      <div className={styles.info}>
        <div className={styles['name-container']}>
          <h6 className={styles.name}>
            <Link to={`${CHALLENGES_URL}/${challenge.id}`}>
              <span dangerouslySetInnerHTML={{ __html: challengeName }} />
            </Link>
          </h6>
        </div>
        <div className={styles.tags}>
          <Tags
            isSelfService={_.get(challenge, "legacy.selfService")}
            tags={challenge.tags}
            onClickTag={onClickTag}
            tooltip={({ children, more }) => (
              <TagsMoreTooltip tags={more} onClickTag={onClickTag}>
                <span>{children}</span>
              </TagsMoreTooltip>
            )}
          />
        </div>
        <div className={styles.nums}>
          <Link to={`${CHALLENGES_URL}/${challenge.id}?tab=registrants`}>
            <NumRegistrants numOfRegistrants={challenge.openPositions} />
          </Link>
          <Link to={submissionLink}>
            <NumSubmissions numOfSubmissions={challenge.numOfSubmissions} />
          </Link>
        </div>
      </div>
      <div className={styles.prize}>
          <span>
              Payment: ${challenge.reviewPayment}
          </span>
      </div>
      <Link to={applyLink}>
            Apply
      </Link>
    </div>
  );
};

ReviewItem.propTypes = {
  challenge: PT.shape(),
  onClickTag: PT.func,
  onClickTrack: PT.func,
  isLoggedIn: PT.bool,
};

export default ReviewItem;
