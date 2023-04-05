/* global process */
import React from "react";
import PT from "prop-types";
import _ from "lodash";
import TrackIcon from "./TrackIcon";
import NumRegistrants from "./NumRegistrants";
import NumSubmissions from "./NumSubmissions";
import Prize from "./Prize";
import Tags from "./Tags";
import PhaseEndDate from "./PhaseEndDate";
import * as utils from "@earn/utils";
import ProgressTooltip from "../tooltips/ProgressTooltip";
import PlacementsTooltip from "../tooltips/PlacementsTooltip";
import TagsMoreTooltip from "../tooltips/TagsMoreTooltip";
import { CHALLENGES_URL } from "@earn/constants";
import { Link } from "react-router-dom";

import "./styles.scss";
import { Button } from "../../../../../../src-ts/lib";

const ReviewItem = ({ challenge, onClickTag, onClickTrack, isLoggedIn }) => {
  const totalPrizes = challenge.overview.totalPrizes;

  let submissionLink = `${CHALLENGES_URL}/${challenge.id}`;
  let applyLink = `${CHALLENGES_URL}/${challenge.id}/review-opportunities`;
  if (isLoggedIn && challenge.numOfSubmissions > 0) {
    submissionLink += "?tab=submissions";
  }

  const challengeName = utils.toBreakableWords(challenge.name, (w) =>
    w.length > 20 ? `<span style="word-break: break-all">${w}</span>` : w
  );

  return (
    <div styleName="challenge-item">
      <div styleName="track">
        <TrackIcon
          track={challenge.track}
          type={challenge.type}
          tcoEligible={_.get(challenge, "events[0].key")}
          onClick={onClickTrack}
        />
      </div>
      <div styleName="info">
        <div styleName="name-container">
          <h6 styleName="name">
            <Link to={`${CHALLENGES_URL}/${challenge.id}`}>
              <span dangerouslySetInnerHTML={{ __html: challengeName }} />
            </Link>
          </h6>
        </div>
        <div styleName="tags">
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
        <div styleName="nums">
          <Link to={`${CHALLENGES_URL}/${challenge.id}?tab=registrants`}>
            <NumRegistrants numOfRegistrants={challenge.openPositions} />
          </Link>
          <Link to={submissionLink}>
            <NumSubmissions numOfSubmissions={challenge.numOfSubmissions} />
          </Link>
        </div>
      </div>
      <div styleName="prize">       
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
