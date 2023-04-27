/**
 * Failed Submission Tooltip Component.
 *
 */

import PT from 'prop-types';

import { Tooltip } from '~/libs/ui';

import { ReactComponent as Failed } from '../../icons/failed.svg';
import styles from './style.scss';

/**
  * Renders the tooltip.
  */
function FailedSubmissionTooltip({
  content,
}) {
  return (
    <div className={styles['failed-submission-tooltip']}>
      <Tooltip content={content} place="top">
        <Failed />
      </Tooltip>
    </div>
  );
}

FailedSubmissionTooltip.defaultProps = {
  content: 'Failed Submission',
};

FailedSubmissionTooltip.propTypes = {
  content: PT.string,
};

export default FailedSubmissionTooltip;
