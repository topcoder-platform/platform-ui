import PT from "prop-types";
import _ from "lodash";
import TrackIcon from "./TrackIcon";
import NumRegistrants from "./NumRegistrants";
import NumSubmissions from "./NumSubmissions";
import Prize from "./Prize";
import Tags from "./Tags";
import PhaseEndDate from "./PhaseEndDate";
import * as utils from "../../../../utils";
import ProgressTooltip from "../tooltips/ProgressTooltip";
import PlacementsTooltip from "../tooltips/PlacementsTooltip";
import TagsMoreTooltip from "../tooltips/TagsMoreTooltip";
import { CHALLENGES_URL } from "../../../../constants";
import { Link } from "react-router-dom";

import styles from "./styles.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

const ChallengeItem = ({ challenge, onClickTag, onClickTrack, isLoggedIn }) => {
  const totalPrizes = challenge.overview.totalPrizes;
  const currencySymbol = utils.challenge.getCurrencySymbol(challenge.prizeSets);
  const placementPrizes = utils.challenge.getPlacementPrizes(
    challenge.prizeSets
  );
  const checkpointPrizes = utils.challenge.getCheckpointPrizes(
    challenge.prizeSets
  );

  let submissionLink = `${CHALLENGES_URL}/${challenge.id}`;
  if (isLoggedIn && challenge.numOfSubmissions > 0) {
    submissionLink += "?tab=submissions";
  }

  const challengeName = utils.toBreakableWords(challenge.name, (w) =>
    w.length > 20 ? `<span style="word-break: break-all">${w}</span>` : w
  );

  return (
    <div className={styled("challenge-item")}>
      <div className={styled("track")}>
        <TrackIcon
          track={challenge.track}
          type={challenge.type}
          tcoEligible={_.get(challenge, "events[0].key")}
          onClick={onClickTrack}
        />
      </div>
      <div className={styled("info")}>
        <div className={styled("name-container")}>
          <h6 className={styled("name")}>
            <Link to={`${CHALLENGES_URL}/${challenge.id}`}>
              <span dangerouslySetInnerHTML={{ __html: challengeName }} />
            </Link>
          </h6>
          <PhaseEndDate
            challenge={challenge}
            tooltip={({ children }) => (
              <ProgressTooltip challenge={challenge}>
                {children}
              </ProgressTooltip>
            )}
          />
        </div>
        <div className={styled("tags")}>
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
        <div className={styled("nums")}>
          <Link to={`${CHALLENGES_URL}/${challenge.id}?tab=registrants`}>
            <NumRegistrants numOfRegistrants={challenge.numOfRegistrants} />
          </Link>
          <Link to={submissionLink}>
            <NumSubmissions numOfSubmissions={challenge.numOfSubmissions} />
          </Link>
        </div>
      </div>
      <div className={styled("prize")}>
        <PlacementsTooltip
          placement="top"
          prizes={placementPrizes}
          checkpointPrizes={checkpointPrizes}
          currencySymbol={currencySymbol}
        >
          <span>
            <Prize totalPrizes={totalPrizes} currencySymbol={currencySymbol} />
          </span>
        </PlacementsTooltip>
      </div>
    </div>
  );
};

ChallengeItem.propTypes = {
  challenge: PT.shape(),
  onClickTag: PT.func,
  onClickTrack: PT.func,
  isLoggedIn: PT.bool,
};

export default ChallengeItem;
