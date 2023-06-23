/**
 * Creates a Promise that resolves after the specified number of milliseconds.
 *
 * @param {number} ms number of milliseconds
 * @returns {Promise}
 */
export const delay = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export function areEmailsEquivalent(emailA, emailB) {
  return normalizeEmail(emailA) === normalizeEmail(emailB);
}

export function normalizeEmail(email) {
  let plusIndex = email.indexOf("+");
  if (plusIndex >= 0) {
    let atIndex = email.indexOf("@", plusIndex);
    email = email.slice(0, plusIndex) + email.slice(atIndex);
  }
  return email;
}

const rxEmail = new RegExp(
  /^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i
);

/**
 * Tests if a string is valid email.
 *
 * @param {String} email The string to test
 * @returns {boolean}
 */
export function isEmailValid(email) {
  return rxEmail.test(email);
}

const rxInteger = /^[1-9]\d*$/;

/**
 * Checks whether the provided string can be converted to an integer value.
 *
 * @param {string} str
 * @returns {boolean}
 */
export function isValidIntegerString(str) {
  return rxInteger.test(str);
}

/**
 * Prevents default action for event.
 *
 * @param {Object} event event object
 */
export function preventDefault(event) {
  event.preventDefault();
}

export const englishCollator = new Intl.Collator("en");

/**
 * Function to be used for sorting arrays with objects that have "name" property.
 *
 * @param {Object} objA object A
 * @param {Object} objB object B
 * @returns {number}
 */
export function sortByName(objA, objB) {
  return englishCollator.compare(objA.name, objB.name);
}
