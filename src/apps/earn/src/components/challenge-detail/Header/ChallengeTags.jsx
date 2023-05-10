/*
  A stateless component that renders "sub track", "events" ,
  "platforms" and "technology" as tag.
  Sub Track and Events have topcoder color accent to denote track.
  Blue - Design, Green - Develop, Orange - Data Science
*/

import _ from "lodash";
import PT from "prop-types";
import config from "../../../config";

import {
  Tag,
  DevelopmentTrackTag,
} from "../Tags";

import { COMPETITION_TRACKS } from "../../../utils/tc";
import VerifiedTag from "../VerifiedTag";
import { calculateScore } from "../../../utils/challenge-listing/helper";
import { styled as styledCss } from "../../../utils";

import MatchScore from "./MatchScore";
import styles from "./style.scss";

const styled = styledCss(styles)

export default function ChallengeTags(props) {
  const {
    isSelfService,
    challengeId,
    challengesUrl,
    track,
    challengeType,
    events,
    technPlatforms,
    setChallengeListingFilter,
    openForRegistrationChallenges,
  } = props;
  const filteredChallenge = _.find(openForRegistrationChallenges, { id: challengeId });
  const matchSkills = filteredChallenge ? filteredChallenge.match_skills || [] : [];
  const matchScore = filteredChallenge ? filteredChallenge.jaccard_index || [] : 0;

  const tags = technPlatforms.filter(tag => !matchSkills.includes(tag));
  const abbreviationName = challengeType ? challengeType.name : null;
  let abbreviation;
  switch (abbreviationName) {
    case 'First2Finish':
      abbreviation = 'F2F';
      break;
    case 'Challenge':
      abbreviation = 'CH';
      break;
    case 'Task':
      abbreviation = 'TSK';
      break;
    default:
      abbreviation = null;
  }

  return (
    <div>
      {
        abbreviation && (
          <div className={styled(`type-tag ${abbreviation} ${track === COMPETITION_TRACKS.QA ? 'qa' : ''}`)}>
            <Tag
              onClick={() => (
                setImmediate(() => setChallengeListingFilter(
                  { types: [abbreviation] },
                ))
              )
              }
              to={`${challengesUrl}?types[]=${encodeURIComponent(abbreviation)}`}
            >
              {abbreviationName}
            </Tag>
          </div>
        )
      }
      {
        abbreviation ? events.map(event => (
          <div
            key={event}
            className={styled(`event-tag ${abbreviation}`)}
          >
            <Tag
              to={`https://${event}.topcoder.com`}
            >
              {event}
            </Tag>
          </div>
        )) : null
      }
      {
        matchScore > 0 && config.ENABLE_RECOMMENDER && (
          <span className={styles.matchScoreWrap}>
            <MatchScore score={calculateScore(matchScore)} />
          </span>
        )
      }
      {
        matchSkills.map(item => (
          <VerifiedTag
            item={item}
            challengesUrl={challengesUrl}
          />
        ))
      }
      {
        isSelfService && (
          <DevelopmentTrackTag>
            <span>On Demand</span>
          </DevelopmentTrackTag>
        )
      }
      {
        tags.map(tag => (
          tag
              && (
              <span>
                <Tag
                  key={tag}
                  onClick={() => setImmediate(() => setChallengeListingFilter({ search: tag }))
                  }
                  to={`${challengesUrl}?search=${
                    encodeURIComponent(tag)}`}
                >
                  {tag}
                </Tag>
              </span>
              )
        ))
      }
    </div>
  );
}

ChallengeTags.defaultProps = {
  events: [],
  technPlatforms: [],
  isSelfService: false,
};

ChallengeTags.propTypes = {
  isSelfService: PT.bool,
  challengeId: PT.string.isRequired,
  challengesUrl: PT.string.isRequired,
  track: PT.string.isRequired,
  events: PT.arrayOf(PT.string),
  technPlatforms: PT.arrayOf(PT.string),
  setChallengeListingFilter: PT.func.isRequired,
  challengeType: PT.shape().isRequired,
  openForRegistrationChallenges: PT.arrayOf(PT.shape()).isRequired,
};
