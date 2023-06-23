/**
 * Functions that return portions of gigs' redux state slice.
 */

export const getGigs = (state) => state.gigs.gigs;

export const getGigsError = (state) => state.gigs.gigsError;

export const getFilteredGigsFeatured = (state) =>
  state.gigs.filteredGigsFeatured;

export const getFilteredGigsHot = (state) => state.gigs.filteredGigsHot;

export const getGigsFeatured = (state) => state.gigs.gigsFeatured;

export const getGigsHot = (state) => state.gigs.gigsHot;

export const getGigsSpecial = (state) => state.gigs.gigsSpecial;

export const getGigsSpecialError = (state) => state.gigs.gigsSpecialError;

export const getHasGigs = (state) =>
  !!state.gigs.gigs?.length ||
  !!state.gigs.filteredGigsFeatured?.length ||
  !!state.gigs.filteredGigsHot?.length;

export const getHasInitialData = (state) =>
  !!state.gigs.gigsSpecial && !!state.gigs.skillsById;

export const getHasSkills = (state) => !!state.gigs.skillsById;

export const getIsLoadingPage = (state) =>
  !!state.gigs.abortController ||
  !state.gigs.gigsSpecial ||
  !state.gigs.skillsById;

export const getFilters = (state) => state.gigs.filters;

export const getLocation = (state) => state.gigs.filters.location;

export const getLocations = (state) => state.gigs.locations;

export const getPageNumber = (state) => state.gigs.pagination.pageNumber;

export const getPageSize = (state) => state.gigs.pagination.pageSize;

export const getPagination = (state) => state.gigs.pagination;

export const getSkillsAll = (state) => state.gigs.skillsAll;

export const getSkillsById = (state) => state.gigs.skillsById;

export const getSkillsByName = (state) => state.gigs.skillsByName;

export const getSkillsError = (state) => state.gigs.skillsError;

export const getSorting = (state) => state.gigs.sorting;

export const getStateSlice = (state) => state.gigs;

export const getTitle = (state) => state.gigs.filters.title;

export const getValues = (state) => state.gigs.values;
