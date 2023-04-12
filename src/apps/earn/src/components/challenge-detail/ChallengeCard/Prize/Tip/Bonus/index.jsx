/**
 * A single bonus componenent.
 * It renders the bonus name inside a colored rectangle,
 * and the bonus number, formatted as currency, next to it.
 */

import PT from 'prop-types';
import React from 'react';
import styles from './style.scss';

export default function Bonus({
  name,
  prize,
  prizeUnitSymbol,
}) {
  return (
    <div className={styles.bonus} aria-label={`${name} bonus is ${prizeUnitSymbol}${prize.toLocaleString()}`}>
      <span aria-hidden="true">
        <span className={styles.name}>
          {name}
        </span>
        {prizeUnitSymbol}
        {prize.toLocaleString()}
      </span>
    </div>
  );
}

Bonus.propTypes = {
  name: PT.string.isRequired,
  prize: PT.number.isRequired,
  prizeUnitSymbol: PT.string.isRequired,
};
