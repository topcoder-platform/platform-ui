import { WORK_STATUS_MAP } from "constants/index.js";

const rxUnderscore = /_/g;

/**
 * Formats work type.
 *
 * @param {string} type work type
 * @returns {string}
 */
export function formatWorkType(type) {
  return type.replace(rxUnderscore, " ").toLowerCase();
}
