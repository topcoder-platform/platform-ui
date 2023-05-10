import styles from "./styles.scss";

import iconNumberOne from "../../../assets/icons/icon-number-one.png";
import iconNumberTwo from "../../../assets/icons/icon-number-two.png";
import iconNumberThree from "../../../assets/icons/icon-number-three.png";
import {
  CHALLENGE_LIST_ROUTE,
  GIGS_FORUM_URL,
  PROFILE_URL,
} from "../../../constants";

/**
 * Displays tips on how to increase chances of getting a job.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const GigTips = ({ className }) => (
  <div className={className}>
    <div className={styles["tips"]}>
      <p>
        At Topcoder, we pride ourselves in bringing our customers the very best
        candidates to help fill their needs. Want to improve your chances? You
        can do a few things:
      </p>
      <ul>
        <li>
          <img className={styles.iconNumberOne} src={iconNumberOne} alt="" />
          <div>
            <strong>
              Make sure your{" "}
              <a target="_blank" rel="noreferrer" href={PROFILE_URL}>
                Topcoder profile
              </a>{" "}
              says it all.
            </strong>{" "}
            Fill out your profile to the best of your ability. Your skills, your
            location, your devices, etc, all help you improve your chances of
            being selected for a gig.
          </div>
        </li>
        <li>
          <img className={styles.iconNumberTwo} src={iconNumberTwo} alt="" />
          <div>
            <strong>Let us know you’re here!</strong> Check in on our{" "}
            <a target="_blank" rel="noreferrer" href={GIGS_FORUM_URL}>
              Gig Work forum
            </a>{" "}
            and tell us you’re looking for a gig. It’s great visibility for the
            Gig team.
          </div>
        </li>
        <li>
          <img
            className={styles.iconNumberThree}
            src={iconNumberThree}
            alt=""
          />
          <div>
            <strong>
              Check out our{" "}
              <a target="_blank" rel="noreferrer" href={CHALLENGE_LIST_ROUTE}>
                Topcoder challenges
              </a>{" "}
              and participate.
            </strong>{" "}
            Challenges showing your technology skills make you a “qualified”
            candidate so we know you’re good. The proof is in the pudding!
          </div>
        </li>
      </ul>
    </div>
    <div className={styles["support"]}>
      If you have any questions or doubts, don’t hesitate to email{" "}
      <a href="mailto:support@topcoder.com">support@topcoder.com</a>.
    </div>
  </div>
);

export default GigTips;
