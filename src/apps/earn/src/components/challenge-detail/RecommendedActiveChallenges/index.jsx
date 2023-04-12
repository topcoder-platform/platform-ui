import _ from 'lodash';
import PT from 'prop-types';
import ChallengesCard from './ChallengesCard';

import styles from './style.scss';

export default function RecommendedActiveChallenges({
  challenges,
  challengeTypes,
  challengesUrl,
  selectChallengeDetailsTab,
  prizeMode,
  auth,
  expandedTags,
  expandTag,
  isLoggedIn,
}) {
  const items = _.map(challenges, (c, idx) => (
    <ChallengesCard
      className={styles['challenge-card']}
      key={idx}
      challengesUrl={challengesUrl}
      selectChallengeDetailsTab={selectChallengeDetailsTab}
      prizeMode={prizeMode}
      userHandle={_.get(auth, 'user.handle')}
      challenge={c}
      challengeType={_.find(challengeTypes, { name: c.type })}
      expandedTags={expandedTags}
      expandTag={expandTag}
      isLoggedIn={isLoggedIn}
    />
  ));

  return (
    <div id="recommendedActiveChallenges" className={styles.container}>
      <div className={styles['header-container']}>
        <div className={styles.header}>
          Recommended Active Challenges
        </div>
        <div className={styles['right-url']}>
          <a href={`${challengesUrl}?bucket=openForRegistration`} rel="noopener noreferrer" target="_blank">All Active Challenges</a>
        </div>
      </div>
      <div className={styles.challenges}>
        {items}
      </div>
    </div>
  );
}

RecommendedActiveChallenges.defaultProps = {
  challenges: [],
  prizeMode: 'money-usd',
  expandedTags: [],
  expandTag: null,
  challengeTypes: [],
};

RecommendedActiveChallenges.propTypes = {
  challenges: PT.arrayOf(PT.object),
  challengeTypes: PT.arrayOf(PT.shape()),
  challengesUrl: PT.string.isRequired,
  selectChallengeDetailsTab: PT.func.isRequired,
  prizeMode: PT.string,
  auth: PT.shape({
    tokenV3: PT.string,
    user: PT.shape({
      handle: PT.string,
    }),
  }).isRequired,
  expandedTags: PT.arrayOf(PT.number),
  expandTag: PT.func,
  isLoggedIn: PT.bool.isRequired,
};
