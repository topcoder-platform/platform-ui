/**
 * Waiting indicator: two co-centric circles periodically increasing their
 * radiuses till maximum value, then resetting it to zero.
 *
 * Animation is done via a client-side script found in client/loading-indicator-animation
 */

import styles from "./style.module.scss";

const LoadingIndicator = () => (
  <svg className={styles.container} viewBox="0 0 64 64">
    <circle
      className={styles.circle1}
      cx="32"
      cy="32"
      r="28"
      id="loading-indicator-circle1"
    />
    <circle
      className={styles.circle2}
      cx="32"
      cy="32"
      r="6"
      id="loading-indicator-circle2"
    />
  </svg>
);

export default LoadingIndicator;
