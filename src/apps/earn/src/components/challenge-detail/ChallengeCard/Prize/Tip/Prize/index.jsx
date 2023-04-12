import PT from 'prop-types';
import React from 'react';
import { styled as styledCss } from '@earn/utils';
import styles from './style.scss';

const styled = styledCss(styles);

const suffixes = ['th', 'st', 'nd', 'rd'];
const getOrdinalSuffix = (n) => {
  const v = n % 100;
  return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
};

/**
 * A single prise component.
 * It renders a round-shaped medal with the specified place number inside it,
 * and the prize, formatted as currency, next to it.
 */
export default function Prize({
  place,
  prize,
  prizeUnitSymbol,
}) {
  let medalStyleName = 'medal';
  if (place <= 3) medalStyleName += ` place-${place}`;
  return (
    <div className={styles.prize} aria-label={`${place}${getOrdinalSuffix(place)} prize is ${prizeUnitSymbol}${prize.toLocaleString()}`}>
      <span aria-hidden="true">
        <span className={styled(medalStyleName)}>
          {place}
        </span>
        {prizeUnitSymbol}
        {prize.toLocaleString()}
      </span>
    </div>
  );
}

Prize.propTypes = {
  place: PT.number.isRequired,
  prize: PT.number.isRequired,
  prizeUnitSymbol: PT.string.isRequired,
};
