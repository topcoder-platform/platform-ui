/**
 * Formats numbers as US dollar sum.
 */
export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const currencyWithCents = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
export const integerFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const currencyParts = currencyWithCents.formatToParts(111111.11);
const decimalSep = currencyParts.find(({ type }) => type === "decimal");
const thousandSep = currencyParts.find(({ type }) => type === "group").value;
const rxNumberString = new RegExp(
  `^[+-]?\\d+(${thousandSep}\\d+)*(${decimalSep}\\d+)?$`
);
const rxThousandSep = new RegExp(thousandSep, "g");

/**
 * Converts string containing a number which was produced by NumberFormat
 * to a number.
 * Note: using the en-US locale.
 *
 * @param {string} numberStr currency string
 * @returns {number}
 */
export function convertNumberStringToNumber(numberStr) {
  return parseFloat(numberStr.replace(rxThousandSep, ""));
}

export function isValidNumberString(numberStr) {
  return rxNumberString.test(numberStr);
}

/**
 * Returns a sum range formatted as USD.
 *
 * @param {number} min minimum sum
 * @param {number} max maximum sum
 * @param {string} minCurrency currency for minimum amount
 * @param {string} [maxCurrency] currency for maximum amount
 * @returns {string}
 */
export function formatPaymentAmount(min, max, minCurrency, maxCurrency = "") {
  let str = null;
  let maxStr = null;
  let minStr = null;
  if (min) {
    minStr = minCurrency + integerFormatter.format(min);
  }
  if (max) {
    maxStr =
      (!minStr ? minCurrency : maxCurrency) + integerFormatter.format(max);
  }
  if (minStr) {
    if (maxStr) {
      str = `${minStr} - ${maxStr}`;
    } else {
      str = minStr + "+";
    }
  } else {
    if (maxStr) {
      str = maxStr;
    } else {
      str = "-";
    }
  }
  return str;
}
