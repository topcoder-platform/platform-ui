/**
 * Just the loading indicator centered above gray background.
 */

import LoadingIndicator from '@earn/components/LoadingIndicator';
import styles from './style.scss';

export default function LoadingPagePlaceholder() {
  return (
    <div className={styles.background}>
      <div className={styles.page}>
        <LoadingIndicator />
      </div>
    </div>
  );
}
