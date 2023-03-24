import styles from "./styles.scss";
import React from "react";
import { useSelector } from "react-redux";
import PT from "prop-types";
import { ReactComponent as IconLinkedIn } from "../../../../assets/icons/icon-linkedin-gray.svg";
import { ReactComponent as IconFacebook } from "../../../../assets/icons/icon-facebook-gray.svg";
import { ReactComponent as IconTwitter } from "../../../../assets/icons/icon-twitter-gray.svg";
import * as userSelectors from "../../../../reducers/gigs/user/selectors";
import { makeFacebookUrl, makeLinkedInUrl, makeTwitterUrl } from "../../../../utils/gigs/url";

const GigSocialLinks = ({ className, label }) => {
  const referralId = useSelector(userSelectors.getReferralId);

  const shareUrl = referralId
    ? `${window.location.origin}${window.location.pathname}?referralId=${referralId}`
    : window.location.href;

  return (
    <div className={[className, styles["container"]].join(' ')}>
      <span className={styles["label"]}>{label}&nbsp;</span>
      <a
        className={styles["social-link"]}
        href={makeLinkedInUrl(shareUrl)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconLinkedIn className={styles.socialIcon} />
      </a>
      <a
        className={styles["social-link"]}
        href={makeFacebookUrl(shareUrl)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconFacebook className={styles.socialIcon} />
      </a>
      <a
        className={styles["social-link"]}
        href={makeTwitterUrl(shareUrl)}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconTwitter className={styles.socialIcon} />
      </a>
    </div>
  );
};

GigSocialLinks.propTypes = {
  className: PT.string,
  label: PT.string.isRequired,
};

export default GigSocialLinks;
