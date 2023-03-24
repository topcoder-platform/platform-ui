import { createActions } from "redux-actions";
import service from "../services/lookup";

/**
 * Gets all the countries.
 * @returns {Array} Array containing all countries
 */
async function getAllCountries() {
  // fetch the first page to see how many more fetches are necessary to get all
  const countries = await service.getPaginatedCountries();
  const {
    meta: { totalPages },
  } = countries;

  const pagesMissing = totalPages - 1;

  // fetch the other pages.
  const allPageResults = await Promise.all(
    [...Array(pagesMissing > 0 ? pagesMissing : 0)].map((_, index) => {
      const newPage = index + 2;

      return service.getPaginatedCountries(newPage);
    })
  );

  const newCountries = allPageResults.map((data) => data).flat();
  return [...countries, ...newCountries];
}

export default createActions({
  GET_ALL_COUNTRIES: getAllCountries,
});
