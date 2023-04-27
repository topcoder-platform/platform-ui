import PT from 'prop-types';
import { DevelopmentTrackEventTag } from '../../Tags';

import styles from './style.scss';

export default function MatchScore({ score }) {
  return (
    <div className={styles.matchScoreTag}>
      <DevelopmentTrackEventTag>
        {score}% match
      </DevelopmentTrackEventTag>
    </div>
  );
}

MatchScore.defaultProps = {
  score: 0,
};

MatchScore.propTypes = {
  score: PT.number,
};
