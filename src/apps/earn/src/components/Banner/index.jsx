import { useState } from "react";
import { ReactComponent as BannerChevronUp} from "../../assets/icons/banner-chevron-up.svg";
import classNames from 'classnames'

import styles from "./styles.scss";

export const Banner = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const header =
    "Welcome to our BETA work listings site - Tell us what you think!";

  return (
    <div className={classNames('banner', styles.banner)}>
      <p className={styles.header}>
        {header}

        <span
          className={classNames('chevron', isExpanded && styles.expanded)}
          role="button"
          tabIndex="0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <BannerChevronUp />
        </span>
      </p>

      {isExpanded && (
        <div className={styles.content}>
          <p>
            Welcome to the Beta version of the new Challenge Listings. During
            this Beta phase, we will be fine-tuning the platform based on
            feedback we receive from you, our community members.
          </p>
          <h3>NOTE THAT THIS IS NOT THE FINAL VERSION OF THE SITE.</h3>
          <p>
            You may encounter occasional broken links or error messages. If so,
            please let us know! This is what the Beta phase is intended for, and
            your feedback will enable us to greatly improve the new site.{" "}
          </p>
          <p>You can click on the Feedback button on page.</p>
          <p>Thank you!</p>
        </div>
      )}
    </div>
  );
};

export default Banner;
