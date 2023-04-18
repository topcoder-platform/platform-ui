/**
 * This component receives via props a single submission data object,
 * and showScreeningDetails boolean property, which should tell whether
 * the Screening Details component should be rendered or not
 * (and also to choose the proper orientation of arrow icon).
 *
 * Also, this component will receive the following callbacks to be triggered
 * when user clicks on buttons/icons/links:
 * onDelete() (to be triggered by delete icon),
 * onDownload() (to be triggered by download icon),
 * onShowDetails() (to be triggered by details arrow icon, and also by screening status component).
 */

import _ from 'lodash';
import moment from 'moment';
import React from 'react';
import { COMPETITION_TRACKS, CHALLENGE_STATUS, safeForDownload } from 'utils/tc';

import PT from 'prop-types';

import DeleteIcon from '../Icons/IconTrashSimple.svg';
import DownloadIcon from '../Icons/IconSquareDownload.svg';
import ExpandIcon from '../Icons/IconMinimalDown.svg';
import ScreeningStatus from '../ScreeningStatus';
import { styled as styledCss } from '@earn/utils';

import styles from './styles.scss';
const styled = styledCss(styles);

export default function Submission(props) {
  const {
    submissionObject,
    showScreeningDetails,
    track,
    onDownload,
    onDelete,
    onShowDetails,
    status,
    allowDelete,
  } = props;
  const formatDate = date => moment(+new Date(date)).format('MMM DD, YYYY hh:mm A');
  const onDownloadSubmission = onDownload.bind(1, submissionObject.id);
  const safeForDownloadCheck = safeForDownload(submissionObject.url);

  return (
    <tr className={styles['submission-row']}>
      <td className={styles['id-col']}>
        <span className={styles['mobile-header']}>ID</span>
        {submissionObject.legacySubmissionId}
        <div className={styles['v5-id']}>{submissionObject.id}</div>
      </td>
      <td className={styles['type-col']}>
        <span className={styles['mobile-header']}>TYPE</span>
        {submissionObject.type}
      </td>
      <td className={styles['date-col']}>
        <span className={styles['mobile-header']}>Submission Date</span>
        {formatDate(submissionObject.created)}
      </td>
      {
         track === COMPETITION_TRACKS.DES && (
           <td className={styles['status-col']}>
             <span className={styles['mobile-header']}>Screening Status</span>
             {safeForDownloadCheck !== true ? safeForDownloadCheck : submissionObject.screening
               && (
                 <ScreeningStatus
                   screeningObject={submissionObject.screening}
                   onShowDetails={onShowDetails}
                   submissionId={submissionObject.id}
                 />
               )}
           </td>
         )
       }
      <td className={styles['action-col']}>
        <div>
          <button
            onClick={() => onDownloadSubmission(submissionObject.id)}
            type="button"
          >
            { safeForDownloadCheck === true && <DownloadIcon /> }
          </button>
          { /*
             TODO: At the moment we just fetch downloads from the legacy
               Topcoder Studio API, and we don't need any JS code to this.
               It may change soon, as we move to the new TC API for
               downloads. Then we'll use this commented out code or
               remove it for good.
           <button
             onClick={() => onDownload(submissionObject.id)}
           ><DownloadIcon /></button>
           */ }
          {status !== CHALLENGE_STATUS.COMPLETED
             && track === COMPETITION_TRACKS.DES
             && safeForDownloadCheck === true && (
             <button
               className={styles['delete-icon']}
               onClick={() => onDelete(submissionObject.id)}
               disabled={!allowDelete}
               type="button"
             >
               <DeleteIcon />
             </button>
          )
          }
          <button
            className={styled(`expand-icon ${(showScreeningDetails ? 'expanded' : '')}`)}
            onClick={() => onShowDetails(submissionObject.id)}
            type="button"
          >
            <ExpandIcon />
          </button>
        </div>
      </td>
    </tr>
  );
}

Submission.defaultProps = {
  submissionObject: {},
  showScreeningDetails: false,
  onShowDetails: _.noop,
};

Submission.propTypes = {
  submissionObject: PT.shape({
    id: PT.string,
    legacySubmissionId: PT.string,
    warpreviewnings: PT.string,
    screening: PT.shape({
      status: PT.string,
    }),
    submitted: PT.string,
    type: PT.string,
    created: PT.any,
    download: PT.any,
    url: PT.string,
  }),
  showScreeningDetails: PT.bool,
  track: PT.string.isRequired,
  onDownload: PT.func.isRequired,
  onDelete: PT.func.isRequired,
  onShowDetails: PT.func,
  status: PT.string.isRequired,
  allowDelete: PT.bool.isRequired,
};