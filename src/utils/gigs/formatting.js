/**
 * Creates the string with the number of items and the word describing the item
 * possibly in plural form.
 *
 * @param {number} count number of entities
 * @param {string} baseWord base word that describes the entity
 * @returns {string}
 */
export function formatPlural(count, baseWord) {
  return `${count} ${baseWord}${count > 1 ? "s" : ""}`;
}
