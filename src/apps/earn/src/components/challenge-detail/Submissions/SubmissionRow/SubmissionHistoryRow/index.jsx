/* eslint jsx-a11y/no-static-element-interactions:0 */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/**
 * SubmissionHistoryRow component.
 */

import React from 'react';
import PT from 'prop-types';
import { getService } from '@earn/services/submissions';
import moment from 'moment';
import { CHALLENGE_STATUS } from '@earn/utils/tc';
import FailedSubmissionTooltip from '../../FailedSubmissionTooltip';
// import Completed from '../../../icons/completed.svg';
import { ReactComponent as InReview } from '../../../icons/in-review.svg';
import { ReactComponent as Queued } from '../../../icons/queued.svg';
import { ReactComponent as DownloadIcon } from '../../../../SubmissionManagement/Icons/IconSquareDownload.svg';

import styles from "./style.scss";
import { styled as styledCss } from "@earn/utils";
const styled = styledCss(styles)

export default function SubmissionHistoryRow({
  isMM,
  isRDM,
  submission,
  finalScore,
  provisionalScore,
  submissionTime,
  isReviewPhaseComplete,
  status,
  challengeStatus,
  auth,
  numWinners,
  submissionId,
  isLoggedIn,
}) {
  const getInitialReviewResult = () => {
    if (provisionalScore && provisionalScore < 0) return <FailedSubmissionTooltip />;
    switch (status) {
      case 'completed':
        return provisionalScore;
      case 'in-review':
        return <InReview />;
      case 'queued':
        return <Queued />;
      case 'failed':
        return <FailedSubmissionTooltip />;
      default:
        return provisionalScore === '-' ? 'N/A' : provisionalScore;
    }
  };
  const getFinalScore = () => {
    if (isMM && finalScore && finalScore > -1 && isReviewPhaseComplete) {
      return finalScore;
    }
    return 'N/A';
  };

  return (
    <div className={styles.container}>
      <div className={styled('row no-border')}>
        <div className={styled('col-1 col')}>
          <div className={styles['mobile-header']}>SUBMISSION</div>
          <span>{submission}</span>
        </div>
        <div className={styled('col-2 col')}>
          <div className={styles['mobile-header']}>FINAL SCORE</div>
          <div>
            {getFinalScore()}
          </div>
        </div>
        <div className={styled('col-3 col')}>
          <div className={styles['mobile-header']}>PROVISIONAL SCORE</div>
          <div>
            {getInitialReviewResult()}
          </div>
        </div>
        <div className={styled(`col-4 col ${isMM ? 'mm' : ''}`)}>
          <div className={styles['mobile-header']}>TIME</div>
          <div>
            {moment(submissionTime).format('DD MMM YYYY')} {moment(submissionTime).format('HH:mm:ss')}
          </div>
        </div>
        {
          isLoggedIn && (isMM || isRDM)
          && (numWinners > 0 || challengeStatus === CHALLENGE_STATUS.COMPLETED) && (
            <div className={styled('col-2 col center')}>
              <div className={styles['mobile-header']}>Action</div>
              <button
                onClick={() => {
                  // download submission
                  const submissionsService = getService(auth.m2mToken);
                  submissionsService.downloadSubmission(submissionId)
                    .then((blob) => {
                      const url = window.URL.createObjectURL(new Blob([blob]));
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `submission-${submissionId}.zip`);
                      document.body.appendChild(link);
                      link.click();
                      link.parentNode.removeChild(link);
                    });
                }}
                type="button"
              >
                <DownloadIcon />
              </button>
            </div>
          )
        }
      </div>
    </div>
  );
}

SubmissionHistoryRow.defaultProps = {
  finalScore: null,
  provisionalScore: null,
  isReviewPhaseComplete: false,
  isLoggedIn: false,
};

SubmissionHistoryRow.propTypes = {
  isMM: PT.bool.isRequired,
  isRDM: PT.bool.isRequired,
  submission: PT.number.isRequired,
  finalScore: PT.oneOfType([
    PT.number,
    PT.string,
  ]),
  status: PT.string.isRequired,
  provisionalScore: PT.oneOfType([
    PT.number,
    PT.string,
  ]),
  submissionTime: PT.string.isRequired,
  challengeStatus: PT.string.isRequired,
  isReviewPhaseComplete: PT.bool,
  auth: PT.shape().isRequired,
  numWinners: PT.number.isRequired,
  submissionId: PT.string.isRequired,
  isLoggedIn: PT.bool,
};
