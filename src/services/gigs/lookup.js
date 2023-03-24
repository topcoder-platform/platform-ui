import api from "./api";

/**
 * Gets paginated countries
 * @param {number} page page to fetch
 * @param {number} perPage number of items by page
 * @returns
 */
async function getPaginatedCountries(page = 1, perPage = 100) {
  const url = `/lookups/countries?page=${page}&perPage=${perPage}`;
  return await api.get(url);
}

/**
 * Gets paginated skills
 * @param {*} page  page to fetch
 * @param {*} perPage number of items by page
 * @returns
 */
async function getPaginatedSkills(page = 1, perPage = 100) {
  const url = `/taas-teams/skills?page=${page}&perPage=${perPage}`;
  return await api.get(url);
}

export default {
  getPaginatedCountries,
  getPaginatedSkills,
};
