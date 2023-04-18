/**
 * This component should render the entire page assembly,
 * but not yet implement the logic behind user actions.
 * It still receives submissions and challenge data, all callbacks, etc. from its parent container
 *
 * Namely, it receives via props: the mock data object (provided along with this specs),
 * the showDetails set, and config object holding all necessary callbacks:
 * onBack() - to trigger when user clicks Back button under the challenge name;
 * onDelete(submissionId);
 * onDownload() (to be triggered by download icon)
 * onOpenOnlineReview(submissionId); onHelp(submissionId);
 * onShowDetails(submissionId);
 * onSubmit() - to trigger when user clicks Add Submission button.
 */

import _ from 'lodash';
import PT from 'prop-types';
import moment from 'moment';

import { IconOutline, LinkButton } from '~/libs/ui';
import LoadingIndicator from '@earn/components/LoadingIndicator';
import { phaseEndDate } from '@earn/utils/challenge-listing/helper';

import SubmissionsTable from '../SubmissionsTable';

import styles from './styles.scss';

export default function SubmissionManagement(props) {
  const {
    challenge,
    submissions,
    loadingSubmissions,
    showDetails,
    onDelete,
    helpPageUrl,
    onDownload,
    onShowDetails,
    challengeUrl,
    onlineReviewUrl,
    submissionPhaseStartDate,
  } = props;

  const { track } = challenge;

  const challengeType = track.toLowerCase();

  const isDesign = challengeType === 'design';
  const isDevelop = challengeType === 'development';
  const currentPhase = challenge.phases
    .filter(p => p.name !== 'Registration' && p.isOpen)
    .sort((a, b) => moment(a.scheduledEndDate).diff(b.scheduledEndDate))[0];
  const submissionPhase = challenge.phases.filter(p => p.name === 'Submission')[0];
  const submissionEndDate = submissionPhase && phaseEndDate(submissionPhase);

  const now = moment();
  const end = moment(currentPhase && currentPhase.scheduledEndDate);
  const diff = end.isAfter(now) ? end.diff(now) : 0;
  const timeLeft = moment.duration(diff);

  const [days, hours, minutes] = [
    timeLeft.get('days'),
    timeLeft.get('hours'),
    timeLeft.get('minutes'),
  ];

  const componentConfig = {
    helpPageUrl,
    onDelete,
    onDownload: onDownload.bind(0, challengeType),
    onlineReviewUrl,
    onShowDetails,
  };
  return (
    <div className={styles['submission-management']}>
      <div className={styles['submission-management-header']}>
        <div className={styles['left-col']}>
          <LinkButton
            secondary
            icon={IconOutline.ChevronLeftIcon}
            iconToLeft
            to={challengeUrl}
            aria-label="Back to challenge list"
          />

          <h4 className={styles.name}>
            {challenge.name}
          </h4>
        </div>
      </div>
      <div className={styles['submission-management-content']}>
        <div className={styles['content-head']}>
          <p className={styles.title}>
            Manage your submissions
          </p>

          {/* {
             isDesign && currentPhase && (
               <p className={styles['round-ends']}>
                 <span className={styles['ends-label']}>
                   {currentPhase.name}
                   {' '}
                   Ends:
                 </span>
                 {' '}
                 {end.format('dddd MM/DD/YY hh:mm A')}
               </p>
             )
           } */}
        </div>
        <div className={styles.subTitle}>
          {
             currentPhase && (
             <p className={styles.round}>
               Current Deadline:{' '}
               <span>{currentPhase.name}</span>
             </p>
             )
           }
          <span className={styles.seperator} />
          {
             challenge.status !== 'Completed' ? (
               <div>
                 <p className={styles.round}>
                   Current Deadline Ends: {' '}
                   <span>
                     {days > 0 && (`${days}D`)}
                     {' '}
                     {hours}
                     H
                     {' '}
                     {minutes}
                     M
                   </span>
                 </p>
               </div>
             ) : (
               <p className={styles['time-left']}>
                 The challenge has ended
               </p>
             )
           }
        </div>
        {
           isDesign && (
             <p className={styles['recommend-info']}>
               {/* eslint-disable-next-line max-len */}
               We always recommend to download your submission to check you uploaded the correct .zip files&nbsp;
               {/* eslint-disable-next-line max-len */}
               and also to verify your declarations file is accurate. If you don’t want to see a submission&nbsp;
               {/* eslint-disable-next-line max-len */}
               simply delete it. If you have a new submissions, use the “Add Submission” button to add one&nbsp;
               to the top of the list.
             </p>
           )
         }
        {
           isDevelop && (
             <p className={styles['recommend-info']}>
               {/* eslint-disable-next-line max-len */}
               We always recommend to download your submission to check you uploaded the correct .zip files&nbsp;
               {/* eslint-disable-next-line max-len */}
               and also to verify your declarations file is accurate. If you don’t want to see a submission&nbsp;
               {/* eslint-disable-next-line max-len */}
               simply delete it. If you have a new submissions, use the “Add Submission” button to add one&nbsp;
               to the top of the list.
             </p>
           )
         }
        {loadingSubmissions && <LoadingIndicator />}
        {!loadingSubmissions
           && (
           <SubmissionsTable
             submissionObjects={submissions}
             showDetails={showDetails}
             track={track}
             status={challenge.status}
             submissionPhaseStartDate={submissionPhaseStartDate}
             {...componentConfig}
           />
           )
         }
      </div>
      {now.isBefore(submissionEndDate) && (
      <div className={styles['btn-wrap']}>
        <LinkButton
          primary
          size='lg'
          to={`${challengeUrl}/submit`}
        >
          {
               (!isDevelop || !submissions || submissions.length === 0)
                 ? 'Add Submission' : 'Update Submission'
             }
        </LinkButton>
      </div>
      )}
    </div>
  );
}

SubmissionManagement.defaultProps = {
  onDelete: _.noop,
  onShowDetails: _.noop,
  onDownload: _.noop,
  onlineReviewUrl: '',
  helpPageUrl: '',
  loadingSubmissions: false,
  challengeUrl: '',
  submissions: [],
};

SubmissionManagement.propTypes = {
  showDetails: PT.shape().isRequired,
  onDelete: PT.func,
  onlineReviewUrl: PT.string,
  helpPageUrl: PT.string,
  onDownload: PT.func,
  onShowDetails: PT.func,
  challenge: PT.shape().isRequired,
  submissions: PT.arrayOf(PT.shape()),
  loadingSubmissions: PT.bool,
  challengeUrl: PT.string,
  submissionPhaseStartDate: PT.string.isRequired,
};
