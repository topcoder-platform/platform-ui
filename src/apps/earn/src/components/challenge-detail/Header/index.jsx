/* eslint-disable jsx-a11y/click-events-have-key-events */
/**
 * Challenge header component.
 * This component renders all other child components part of the header.
 * Any data massaging needed for a child view should be done here.
 */

import _ from 'lodash';
import moment from 'moment';
import 'moment-duration-format';
import PT from 'prop-types';

import { isMM } from '@earn/utils/challenge';
import { IconOutline, LinkButton, UiButton } from '~/libs/ui';
import { COMPETITION_TRACKS } from '@earn/utils/tc';
import { phaseEndDate } from '@earn/utils/challenge-listing/helper';
import {
  getTimeLeft,
} from '@earn/utils/challenge-detail/helper';
import { ReactComponent as ArrowUp } from '@earn/assets/images/icon-arrow-up.svg';
import { ReactComponent as ArrowDown } from '@earn/assets/images/icon-arrow-down.svg';

import Prizes from './Prizes';
import ChallengeTags from './ChallengeTags';
import DeadlinesPanel from './DeadlinesPanel';
import TabSelector from './TabSelector';

import styles from './style.scss';
import { styled as styledCss } from "../../../utils";

const styled = styledCss(styles)

/* Holds day and hour range in ms. */
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export default function ChallengeHeader(props) {
  const {
    isLoggedIn,
    challenge,
    challengesUrl,
    checkpoints,
    hasRegistered,
    numWinners,
    onSelectorClicked,
    onToggleDeadlines,
    registering,
    registerForChallenge,
    setChallengeListingFilter,
    unregisterFromChallenge,
    unregistering,
    challengeTypesMap,
    selectedView,
    showDeadlineDetail: showDeadlineDetailProp,
    hasFirstPlacement,
    hasThriveArticles,
    hasRecommendedChallenges,
    isMenuOpened,
    submissionEnded,
    mySubmissions,
    openForRegistrationChallenges,
    onSort,
    viewAsTable,
  } = props;

  const {
    drPoints,
    id: challengeId,
    name,
    pointPrizes,
    events,
    prizeSets,
    reliabilityBonus,
    numOfRegistrants,
    numOfCheckpointSubmissions,
    numOfSubmissions,
    status,
    type,
    track,
  } = challenge;
  const showDeadlineDetail = showDeadlineDetailProp;
  const tags = challenge.tags || [];

  const allPhases = _.filter(challenge.phases || [], p => p.name !== 'Post-Mortem');
  const sortedAllPhases = _.cloneDeep(allPhases)
    .sort((a, b) => moment(phaseEndDate(a)).diff(phaseEndDate(b)));

  const placementPrizes = _.find(prizeSets, { type: 'placement' });
  const { prizes } = placementPrizes || [];
  const checkpointPrizes = _.find(prizeSets, { type: 'checkpoint' });
  let numberOfCheckpointsPrizes = 0;
  let topCheckPointPrize = 0;
  if (!_.isEmpty(checkpointPrizes)) {
    numberOfCheckpointsPrizes = checkpointPrizes.prizes.length;
    topCheckPointPrize = checkpointPrizes.prizes[0].value;
  }

  const phases = {};
  if (allPhases) {
    allPhases.forEach((phase) => {
      phases[_.camelCase(phase.name)] = phase;
    });
  }

  let registrationEnded = true;
  const regPhase = phases && phases.registration;
  if (status !== 'Completed' && regPhase) {
    registrationEnded = !regPhase.isOpen;
  }

  const currentPhases = challenge.phases
    .filter(p => p.name !== 'Registration' && p.isOpen)
    .sort((a, b) => moment(a.scheduledEndDate).diff(b.scheduledEndDate))[0];

  const trackLower = track ? track.replace(' ', '-').toLowerCase() : 'design';

  const eventNames = (events || []).map((event => (event.eventName || '').toUpperCase()));

  const miscTags = _.uniq(_.isArray(tags) ? tags : (tags || '').split(', '));

  let bonusType = '';
  if (numberOfCheckpointsPrizes && topCheckPointPrize) {
    bonusType = 'Bonus';
  } else if (reliabilityBonus && reliabilityBonus.toFixed() !== '0') {
    bonusType = 'Reliability Bonus';
  }

  /* userDetails.hasUserSubmittedForReview does not reset to false
     * if the user has deleted all of their submissions, so we have to
     * iterate through all their submissions and ensure that all of them
     * are Deleted
    */
  const hasSubmissions = !_.isEmpty(mySubmissions);

  const openPhases = sortedAllPhases.filter(p => p.isOpen);
  let nextPhase = openPhases[0];
  if (hasRegistered && openPhases[0] && openPhases[0].name === 'Registration') {
    nextPhase = openPhases[1] || {};
  }

  const deadlineEnd = moment(nextPhase && phaseEndDate(nextPhase));
  const currentTime = moment();

  const timeDiff = getTimeLeft(currentPhases, 'to go', true);

  if (!timeDiff.late) {
    timeDiff.text = timeDiff.text.replace('to go', '');
  }

  let timeLeft = deadlineEnd.isAfter(currentTime)
    ? deadlineEnd.diff(currentTime) : 0;

  let format;
  if (timeLeft > DAY_MS) format = 'D[d] H[h]';
  else if (timeLeft > HOUR_MS) format = 'H[h] m[min]';
  else format = 'm[min] s[s]';

  timeLeft = moment.duration(timeLeft).format(format);

  let relevantPhases = [];

  if (showDeadlineDetail) {
    relevantPhases = (allPhases || []).filter((phase) => {
      if (phase.name === 'Iterative Review') {
        const end = phaseEndDate(phase);
        return moment(end).isAfter();
      }
      // do not show [Specification Submission, Specification Review, Approval]
      // phases for design challenges
      if (trackLower === 'design'
        && ['Specification Submission', 'Specification Review', 'Approval'].indexOf(phase.name) >= 0) {
        return false;
      }
      return true;
    });

    relevantPhases.sort((a, b) => {
      if (a.name.toLowerCase().includes('registration')) {
        return -1;
      }
      if (b.name.toLowerCase().includes('registration')) {
        return 1;
      }
      const aEndDate = phaseEndDate(a);
      const bEndDate = phaseEndDate(b);
      return moment(aEndDate).diff(bEndDate);
    });

    if (trackLower === 'design') {
      // condition for 2 round challenge for now
      let finalStartDate;
      if (relevantPhases.length === 8 || challenge.timelineTemplateId === 'd4201ca4-8437-4d63-9957-3f7708184b07') {
        relevantPhases = _.filter(relevantPhases, p => !(p.name.toLowerCase().includes('checkpoint screening') || p.name.toLowerCase().includes('screening')));
        _.map(relevantPhases, (phase) => {
          if (phase.name === 'Checkpoint Review') {
            finalStartDate = phase.scheduledEndDate;
          }
          if (phase.name === 'Submission') {
            // eslint-disable-next-line no-param-reassign
            phase.scheduledStartDate = finalStartDate;
          }
        });
      }
    }
    if (trackLower === 'quality-assurance') {
      relevantPhases = _.filter(relevantPhases, p => !(p.name.toLowerCase().includes('specification submission') || p.name.toLowerCase().includes('specification review')));
    }
    if (type === 'First2Finish' && status === 'Completed') {
      const phases2 = allPhases.filter(p => p.name === 'Iterative Review' && !p.isOpen);
      const endPhaseDate = Math.max(...phases2.map(d => phaseEndDate(d)));
      relevantPhases = _.filter(relevantPhases, p => (p.name.toLowerCase().includes('registration')
          || phaseEndDate(p).getTime() < endPhaseDate));
      relevantPhases.push({
        id: -1,
        name: 'Winners Announced',
        isOpen: false,
        actualEndDate: endPhaseDate,
        scheduledEndDate: endPhaseDate,
      });
    } else if (relevantPhases.length > 1) {
      // const lastPhase = relevantPhases[relevantPhases.length - 1];
      // const lastPhaseTime = phaseEndDate(lastPhase).getTime();
      const appealsEndDate = phaseEndDate(sortedAllPhases[sortedAllPhases.length - 1]);
      // const appealsEnd = appealsEndDate.getTime();
      relevantPhases.push({
        id: -1,
        name: 'Winners Announced',
        isOpen: false,
        actualEndDate: appealsEndDate,
        scheduledEndDate: appealsEndDate,
      });
    }
  }

  const checkpointCount = checkpoints && checkpoints.numberOfPassedScreeningSubmissions;

  let nextDeadlineMsg;
  switch ((status || '').toLowerCase()) {
    case 'completed':
      nextDeadlineMsg = (
        <div className={styles.completed}>
          The challenge is finished.
        </div>
      );
      break;
    case 'active':
      break;
    default:
      nextDeadlineMsg = (
        <div>
          Status:
          &zwnj;
          <span className={styles['deadline-highlighted']}>
            {_.upperFirst(_.lowerCase(status))}
          </span>
        </div>
      );
      break;
  }

  // Legacy MMs have a roundId field, but new MMs do not.
  // This is used to disable registration/submission for legacy MMs.
  const isLegacyMM = isMM(challenge) && Boolean(challenge.roundId);

  if (hasFirstPlacement && !_.isEmpty(allPhases)) {
    _.some(allPhases, { phaseType: 'Final Fix', phaseStatus: 'Open' });
  }

  const disabled = !hasRegistered || unregistering || submissionEnded || isLegacyMM;
  const registerButtonDisabled = registering || registrationEnded || isLegacyMM;
  const unregisterButtonDisabled = unregistering
    || registrationEnded || hasSubmissions || isLegacyMM;
  return (
    <div className={styles['challenge-outer-container']}>
      <div className={styles['important-detail']}>
        <div className={styles['title-wrapper']} aria-hidden={isMenuOpened}>
          <LinkButton
            to={challengesUrl}
            aria-label="Back to challenge list"
            icon={IconOutline.ChevronLeftIcon}
            secondary
            size='md'
          />
          <div>
            <h1 className={styles['challenge-header']}>
              {name}
            </h1>
            <div className={styles['tag-container']}>
              <ChallengeTags
                isSelfService={challenge.legacy.selfService}
                challengeId={challengeId}
                track={track}
                challengeType={_.find(challengeTypesMap, { name: type }) || {}}
                challengesUrl={challengesUrl}
                events={eventNames}
                technPlatforms={miscTags}
                setChallengeListingFilter={setChallengeListingFilter}
                openForRegistrationChallenges={openForRegistrationChallenges}
              />
              {(hasRecommendedChallenges || hasThriveArticles) && (
              <div className={styles['recommend-container']}>
                {hasRecommendedChallenges && (
                <div
                  className={styled('recommend-tag link')}
                  role="button"
                  tabIndex={0}
                  onClick={
                          () => {
                            document.getElementById('recommendedActiveChallenges').scrollIntoView();
                          }}
                >
                  Recommended Challenges
                </div>
                )}

                {hasRecommendedChallenges && hasThriveArticles && (
                <div className={styled('recommend-tag separator')} />
                )}

                {hasThriveArticles && (
                <div
                  className={styled('recommend-tag link')}
                  role="button"
                  tabIndex={0}
                  onClick={
                          () => {
                            document.getElementById('recommendedThriveArticles').scrollIntoView();
                          }}
                >Recommended THRIVE Articles
                </div>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
        <div className={styles['prizes-ops-container']}>
          <div className={styles['prizes-outer-container']}>
            <h2 className={styles['prizes-title']}>
              Key Information
            </h2>
            <Prizes prizes={prizes && prizes.length ? prizes : []} pointPrizes={pointPrizes} />
            {
                bonusType ? (
                  <div id={`bonus-${trackLower}`} className={styles['bonus-div']}>
                    {
                      bonusType === 'Bonus'
                        ? (
                          <p className={styles['bonus-text']}>
                            <span className={styled(`bonus-highlight ${trackLower}-accent-color`)}>
                              BONUS:
                              {' '}
                              {numberOfCheckpointsPrizes}
                            </span>
                            &zwnj;
                            CHECKPOINTS AWARDED WORTH
                            &zwnj;
                            <span
                              className={styled(`bonus-highlight ${trackLower}-accent-color`)}
                            >
                              $
                              {topCheckPointPrize}
                            </span>
                            &zwnj;
                            EACH
                          </p>
                        )
                        : (
                          <p className={styles['bonus-text']}>
                            <span className={styled(`bonus-highlight ${trackLower}-accent-color`)}>
                              RELIABILITY BONUS: $
                              {reliabilityBonus.toFixed()}
                            </span>
                          </p>
                        )
                    }
                  </div>
                ) : null
              }
            {
                drPoints ? (
                  <div className={styles['bonus-div']}>
                    <p className={styles['bonus-text']}>
                      <span className={styled(`bonus-highlight ${trackLower}-accent-color`)}>
                        POINTS:
                        {drPoints}
                      </span>
                    </p>
                  </div>
                ) : null
              }
          </div>
          <div className={styled("challenge-ops-wrapper")}>
            <div className={styled("challenge-ops-container")}>
              {hasRegistered ? (
                <UiButton
                  disabled={unregisterButtonDisabled}
                  onClick={unregisterFromChallenge}
                  secondary
                  size='xl'
                >
                  Unregister
                </UiButton>
              ) : (
                <UiButton
                    primary
                    disabled={registerButtonDisabled}
                    onClick={registerForChallenge}
                    size='xl'
                >
                  Register
                </UiButton>
              )}
              <LinkButton
                primary
                disabled={disabled}
                size='xl'
                to={`${challengesUrl}/${challengeId}/submit`}
              >
                Submit
              </LinkButton>
              {
                track === COMPETITION_TRACKS.DES && hasRegistered && !unregistering
                  && hasSubmissions && (
                  <LinkButton
                    primary
                    size="md"
                    to={`${challengesUrl}/${challengeId}/my-submissions`}
                  >
                    View Submissions
                  </LinkButton>
                )
              }
            </div>
          </div>
        </div>
        <div className={styles['deadlines-view']}>
          <div className={styled(`deadlines-overview ${showDeadlineDetail ? 'opened' : ''}`)}>
            <div className={styles['deadlines-overview-text']}>
              {nextDeadlineMsg}
              {
                  (status || '').toLowerCase() === 'active'
                  && (
                  <div className={styles['current-phase']}>
                    {currentPhases && `${currentPhases.name} Ends In: `}
                    <span className={styles['deadline-highlighted']}>
                      {timeDiff.text}
                    </span>
                  </div>
                  )
                }
            </div>
            <a
              onClick={onToggleDeadlines}
              onKeyPress={onToggleDeadlines}
              role="button"
              className={styled("deadlines-collapser")}
              tabIndex={0}
            >
              {showDeadlineDetail
                ? (
                  <span className={styles['collapse-text']}>
                    <ArrowDown />
                  </span>
                )
                : (
                  <span className={styles['collapse-text']}>
                    <ArrowUp />
                  </span>
                )
                }
            </a>
          </div>
          {
              showDeadlineDetail
              && <DeadlinesPanel deadlines={relevantPhases} />
            }
        </div>
        <TabSelector
          isLoggedIn={isLoggedIn}
          challenge={challenge}
          isMM={isMM(challenge)}
          onSelectorClicked={onSelectorClicked}
          trackLower={trackLower}
          selectedView={selectedView}
          numOfRegistrants={numOfRegistrants}
          numWinners={numWinners}
          hasCheckpoints={checkpoints && checkpoints.length > 0}
          numOfSubmissions={numOfSubmissions}
          numOfCheckpointSubmissions={numOfCheckpointSubmissions}
          hasRegistered={hasRegistered}
          checkpointCount={checkpointCount}
          mySubmissions={mySubmissions}
          onSort={onSort}
          viewAsTable={viewAsTable}
        />
      </div>
    </div>
  );
}

ChallengeHeader.defaultProps = {
  isLoggedIn: false,
  checkpoints: {},
  isMenuOpened: false,
  hasThriveArticles: false,
  hasRecommendedChallenges: false,
};

ChallengeHeader.propTypes = {
  isLoggedIn: PT.bool,
  checkpoints: PT.shape(),
  challenge: PT.shape({
    id: PT.string.isRequired,
    legacy: PT.shape({
      selfService: PT.bool,
    }),
    type: PT.any,
    track: PT.string,
    drPoints: PT.any,
    name: PT.any,
    pointPrizes: PT.any,
    events: PT.any,
    technologies: PT.any,
    platforms: PT.any,
    tags: PT.any,
    prizes: PT.any,
    timelineTemplateId: PT.string,
    reliabilityBonus: PT.any,
    userDetails: PT.any,
    numOfRegistrants: PT.any,
    numOfCheckpointSubmissions: PT.any,
    numOfSubmissions: PT.any,
    status: PT.any,
    phases: PT.any,
    roundId: PT.any,
    prizeSets: PT.any,
    match_skills: PT.arrayOf(PT.string),
  }).isRequired,
  challengesUrl: PT.string.isRequired,
  hasRegistered: PT.bool.isRequired,
  hasThriveArticles: PT.bool,
  hasRecommendedChallenges: PT.bool,
  submissionEnded: PT.bool.isRequired,
  numWinners: PT.number.isRequired,
  onSelectorClicked: PT.func.isRequired,
  onToggleDeadlines: PT.func.isRequired,
  registerForChallenge: PT.func.isRequired,
  registering: PT.bool.isRequired,
  selectedView: PT.string.isRequired,
  setChallengeListingFilter: PT.func.isRequired,
  showDeadlineDetail: PT.bool.isRequired,
  unregisterFromChallenge: PT.func.isRequired,
  unregistering: PT.bool.isRequired,
  challengeTypesMap: PT.shape().isRequired,
  hasFirstPlacement: PT.bool.isRequired,
  isMenuOpened: PT.bool,
  mySubmissions: PT.arrayOf(PT.shape()).isRequired,
  openForRegistrationChallenges: PT.arrayOf(PT.shape()).isRequired,
  onSort: PT.func.isRequired,
  viewAsTable: PT.bool.isRequired,
};
