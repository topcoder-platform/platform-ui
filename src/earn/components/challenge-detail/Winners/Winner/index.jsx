import PT from "prop-types";
import React, { useEffect, useState } from "react";
import _ from "lodash";
import config from "@earn/config";

import Lock from "../../icons/lock.svg";
import Avatar from '../../../Avatar';

import style from "./style.module.scss";

function getId(submissions, placement) {
  return submissions.find((s) => s.placement === placement).submissionId;
}

export default function Winner({
  isDesign,
  last,
  prizes,
  submissions,
  viewable,
  winner,
}) {
  const [windowOrigin, setWindowOrigin] = useState();
  useEffect(() => {
    setWindowOrigin(config.URL.BASE);
  }, []);

  const submissionId = viewable && getId(submissions, winner.placement);

  let placeStyle = winner.placement < 4 ? `place-${winner.placement}` : "";
  if (last) placeStyle += " last";

  let avatarUrl = winner.photoURL;
  if (avatarUrl) {
    avatarUrl = `${config.CDN.PUBLIC}/avatar/${encodeURIComponent(
      avatarUrl
    )}?size=65`;
  }

  let prize = "N/A";
  const prizeIndex = parseInt(winner.placement, 10) - 1;
  if (prizes[prizeIndex]) prize = prizes[prizeIndex].value;

  return (
    <div styleName={`winner ${placeStyle}`}>
      <div styleName="thumbnail">
        <div styleName="flag">{winner.placement}</div>
        {viewable && isDesign ? (
          <img
            styleName="preview"
            alt=""
            src={
              `${config.URL.STUDIO}/studio.jpg` +
              `?module=DownloadSubmission&sbmid=${submissionId}&sbt=small&sfi=1`
            }
          />
        ) : (
          <div styleName="lock">
            <Lock styleName="lock-icon" />
            <div styleName="text">LOCKED</div>
          </div>
        )}
      </div>
      <div styleName="info">
        <div styleName="avatar-prize">
          <Avatar className={style.avatar} url={avatarUrl} />
          <div>
            <a
              href={`${config.URL.PLATFORM_WEBSITE}/profile/${winner.handle}`}
              styleName="handle"
              target={`${_.includes(windowOrigin, "www") ? "_self" : "_blank"}`}
            >
              {winner.handle}
            </a>
            <div styleName="prize">${prize}</div>
          </div>
        </div>
        {submissionId && (
          <div styleName="id">
            ID:
            <span>#{getId(submissions, winner.placement)}</span>
          </div>
        )}
        {winner.submissionDownloadLink && viewable && (
          <a
            href={
              isDesign
                ? `${config.URL.STUDIO}/?module=DownloadSubmission&sbmid=${submissionId}`
                : winner.submissionDownloadLink
            }
            styleName="download"
            target="_blank"
            challenge
            rel="noopener noreferrer"
          >
            Download
          </a>
        )}
        {/*
          <div styleName="date">
            <span>Submitted&nbsp;on:</span>&zwnj;
            &zwnj;<span>{moment(winner.submissionDate).format('MMM DD, YYYY HH:mm')}</span>
          </div>
          */}
      </div>
    </div>
  );
}

Winner.defaultProps = {
  prizes: [],
};

Winner.propTypes = {
  isDesign: PT.bool.isRequired,
  last: PT.bool.isRequired,
  prizes: PT.arrayOf(PT.number),
  submissions: PT.arrayOf(PT.object).isRequired,
  viewable: PT.bool.isRequired,
  winner: PT.shape({
    handle: PT.string.isRequired,
    placement: PT.number.isRequired,
    photoURL: PT.any,
    submissionDownloadLink: PT.any,
  }).isRequired,
};
