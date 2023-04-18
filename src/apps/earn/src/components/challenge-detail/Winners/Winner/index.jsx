import Avatar from '@earn/components/Avatar';
import PT from 'prop-types';
import { getService } from '@earn/services/submissions';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import config from '@earn/config';
import { formatOrdinals, numberWithCommas } from '@earn/utils/challenge-detail/helper';
import { getMMSubmissionId } from '@earn/utils/submissions';
import { ReactComponent as DownloadIcon } from '../../../SubmissionManagement/Icons/IconSquareDownload.svg';
import { styled as styledCss } from "@earn/utils";

import styles from './style.scss';
const styled = styledCss(styles);

function getId(submissions, placement) {
  return submissions.find(s => s.placement === placement).submissionId;
}

export default function Winner({
  isDesign,
  isMM,
  isRDM,
  prizes,
  submissions,
  viewable,
  winner,
  isLoggedIn,
  auth,
}) {
  const [windowOrigin, setWindowOrigin] = useState();
  useEffect(() => {
    setWindowOrigin(window.origin);
  }, []);

  const submissionId = viewable && getId(submissions, winner.placement);
  const mmSubmissionId = (isMM || isRDM) && getMMSubmissionId(submissions, winner.handle);

  let avatarUrl = winner.photoURL;
  if (avatarUrl) {
    avatarUrl = `${config.CDN.PUBLIC}/avatar/${
      encodeURIComponent(avatarUrl)}?size=65`;
  }

  let prize = 'N/A';
  const prizeIndex = parseInt(winner.placement, 10) - 1;
  if (prizes[prizeIndex]) prize = prizes[prizeIndex].value;

  return (
    <div className={styles.winner}>
      <div className={styles.left}>
        <div className={styled(`placement ${(winner.placement && winner.placement < 4) ? 'placement-' + winner.placement : ''}`)}>
          <span>{formatOrdinals(winner.placement)}</span>
        </div>
        <div className={styles.info}>
          <div className={styles['avatar-prize']}>
            <Avatar
              theme={{ avatar: styles.avatar }}
              url={avatarUrl}
            />
            <div>
              <a
                href={`${windowOrigin}/members/${winner.handle}`}
                className={styles.handle}
                target={`${_.includes(windowOrigin, 'www') ? '_self' : '_blank'}`}
              >
                {winner.handle}
              </a>
            </div>
          </div>
          {
            submissionId
            && (
            <div className={styles.id}>
              ID:
              <span>
                #
                {getId(submissions, winner.placement)}
              </span>
            </div>
            )
          }
        </div>
      </div>

      <div className={styles.right}>
        <div className={styles.prize}>
          $
          {numberWithCommas(prize)}
        </div>
      </div>
      <div className={styles['download-container']}>
        {
        ((!winner.submissionDownloadLink || !viewable) && (isMM || isRDM) && isLoggedIn) && (
          <button
            onClick={() => {
              // download submission
              const submissionsService = getService(auth.m2mToken);
              submissionsService.downloadSubmission(mmSubmissionId)
                .then((blob) => {
                  const url = window.URL.createObjectURL(new Blob([blob]));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `submission-${mmSubmissionId}.zip`);
                  document.body.appendChild(link);
                  link.click();
                  link.parentNode.removeChild(link);
                });
            }}
            type="button"
          >
            <DownloadIcon />
          </button>
        )
        }
        {
          (winner.submissionDownloadLink && viewable)
          && (
          <a
            href={isDesign ? `${config.URL.STUDIO}/?module=DownloadSubmission&sbmid=${submissionId}` : winner.submissionDownloadLink}
            className={styles.download}
            target="_blank"
            challenge
            rel="noopener noreferrer"
          >
            <DownloadIcon />
          </a>
          )
        }
        {
          /*
          <div className={styles.date}>
            <span>Submitted&nbsp;on:</span>&zwnj;
            &zwnj;<span>{moment(winner.submissionDate).format('MMM DD, YYYY HH:mm')}</span>
          </div>
          */
        }
      </div>
    </div>
  );
}

Winner.defaultProps = {
  prizes: [],
};

Winner.propTypes = {
  isDesign: PT.bool.isRequired,
  isMM: PT.bool.isRequired,
  isRDM: PT.bool.isRequired,
  prizes: PT.arrayOf(PT.shape()),
  submissions: PT.arrayOf(PT.object).isRequired,
  viewable: PT.bool.isRequired,
  winner: PT.shape({
    handle: PT.string.isRequired,
    placement: PT.number.isRequired,
    photoURL: PT.any,
    submissionDownloadLink: PT.any,
  }).isRequired,
  isLoggedIn: PT.bool.isRequired,
  auth: PT.shape().isRequired,
};
