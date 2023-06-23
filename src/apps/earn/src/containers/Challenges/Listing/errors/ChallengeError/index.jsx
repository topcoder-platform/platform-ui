import IconNotFound from "../../../../../assets/icons/not-found.png";

import styles from "./styles.scss";

const ChallengeError = () => (
  <div className={styles["challenge-error"]}>
    <h1>
      <img src={IconNotFound} alt="not found" />
    </h1>
    <p>
      No challenges were found. You can try changing your search parameters.
    </p>
  </div>
);

export default ChallengeError;
