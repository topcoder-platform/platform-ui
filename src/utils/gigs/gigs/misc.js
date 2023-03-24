import { LOCATION } from "../../../constants/gigs";
import { isNumber } from "lodash";
import { englishCollator } from "../../../utils/gigs/misc";

/**
 * Function to be used to sort locations' array.
 *
 * @param {string} locA location A
 * @param {string} locB location B
 * @returns {number}
 */
export function sortLocations(locA, locB) {
  if (locA === LOCATION.ALL) {
    return -1;
  }
  if (locB === LOCATION.ALL) {
    return 1;
  }
  return englishCollator.compare(locA, locB);
}

/**
 * Filter array values based on a field's value - string type
 *
 */
export function filterString(source, key, value) {
  if (!source || (source && source.length == 0)) {
    return [];
  }
  return source.filter((item) => !item[key] || item[key].indexOf(value) >= 0);
}

/**
 * Filter array values based on subItems existing in the target array or not.
 *
 */
export function filterElement(source, key, values) {
  if (!source || (source && source.length == 0)) {
    return [];
  }
  if (values.length == 0) {
    return source;
  }
  return source.filter((item) => {
    if (!item[key]) return false;
    for (let i = 0; i < values.length; i++) {
      if (item[key].indexOf(values[i]) >= 0) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Filter payment ranges
 **/
export function filterRange(source, keyLeft, keyRight, rangeLeft, rangeRight) {
  if (!source || (source && source.length == 0)) {
    return [];
  }
  if (rangeLeft > rangeRight) {
    return source;
  }
  if (!isNumber(rangeLeft) || !isNumber(rangeRight)) {
    return source;
  }
  return source.filter((item) => {
    if (!item) return false;
    const payment = item.payment;
    if (!payment) return false;
    if (
      isNumber(payment[keyLeft]) &&
      isNumber(payment[keyRight]) &&
      payment[keyLeft] >= rangeLeft &&
      payment[keyRight] <= rangeRight
    ) {
      return true;
    }
    return false;
  });
}
