/*
  Component to show the prize details for given challenge.
*/
import _ from 'lodash';
import PT from 'prop-types';

import styles from './style.scss';

function getOrdinal(num) {
  const ordinals = ['th', 'st', 'nd', 'rd'];
  const v = num % 100;
  return ordinals[(v - 20) % 10] || ordinals[v] || ordinals[0];
}

export default function Prizes({ pointPrizes, prizes }) {
  const prizeLength = Math.max(pointPrizes.length, prizes.length);
  return (
    <div className={styles['prizes-container']}>
      {
        _.range(prizeLength).map((index) => {
          const rank = index + 1;
          const pair = [];
          const isPrizeIndexNotUndefined = !_.isUndefined(prizes[index])
            && !_.isUndefined(prizes[index].value);
          if (isPrizeIndexNotUndefined) pair.push(prizes[index].value.toLocaleString());
          if (!_.isUndefined(pointPrizes[index])) pair.push(`${pointPrizes[index]}pts`);
          return (
            <div
              className={styles['prize-fill']}
              key={rank}
            >
              {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
              <div id={`rank${rank}`} tabIndex={0} className={styles['prize-card']} aria-label={`${rank}${getOrdinal(rank)} prize is ${!_.isUndefined(prizes[index]) ? '$' : ''}${pair.join(' + ')}`}>
                <p className={styles['prize-rank']} aria-hidden="true">
                  {rank}
                  <span className={styles['rank-ordinal']}>
                    {getOrdinal(rank)}
                  </span>
                </p>
              </div>
              <p className={styles['prize-money']} aria-hidden="true">
                {
                  isPrizeIndexNotUndefined && (
                  <span className={styles['prize-currency']}>
                    $
                  </span>
                  )
                }
                {pair.join(' + ')}
              </p>
            </div>
          );
        })
      }
    </div>
  );
}

Prizes.defaultProps = {
  pointPrizes: [],
  prizes: [],
};

Prizes.propTypes = {
  pointPrizes: PT.arrayOf(PT.number),
  prizes: PT.arrayOf(PT.shape()),
};
