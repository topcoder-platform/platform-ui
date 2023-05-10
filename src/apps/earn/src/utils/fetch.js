/**
 * Checks whether the error object is an AbortError from fetch.
 *
 * @param {Error} error error object to check
 * @returns {boolean}
 */
export function isAbort(error) {
  return error instanceof DOMException && error.name === "AbortError";
}
