import { handleActions } from "redux-actions";
import * as ACTION_TYPE from "../../actions/gigs/types";
import {
  GIGS_HOT_COUNT,
  LOCATION,
  SORT_BY_DEFAULT,
  SORT_ORDER_DEFAULT,
} from "../../constants";
import { updateStateFromQuery } from "./urlQuery";
import {
  integerFormatter,
  convertNumberStringToNumber,
} from "../../utils/gigs/formatting";
import {
  sortLocations,
  filterString,
  filterElement,
  filterRange,
} from "../../utils/gigs/misc";

const clientSideFilters = (state, slice) => {
  let gigsRes = state[slice];
  if (state.filters.title !== "") {
    gigsRes = filterString(gigsRes, "title", state.filters.title);
  }
  if (state.filters && state.filters.location !== "All") {
    gigsRes = filterString(gigsRes, "location", state.filters.location);
  }
  if (state.filters && state.filters.skills.length > 0) {
    gigsRes = filterElement(gigsRes, "skills", state.filters.skills);
  }
  const { paymentMax, paymentMin } = state.values;
  gigsRes = filterRange(
    gigsRes,
    "min",
    "max",
    convertNumberStringToNumber(paymentMin),
    convertNumberStringToNumber(paymentMax)
  );
  return gigsRes;
};

const abortControllerDummy = { abort() {} };

const initPagination = () => ({
  pageCount: 0,
  pageNumber: 1,
  pageSize: 10,
  totalCount: 0,
});

const initFilters = () => ({
  location: LOCATION.ALL,
  paymentMax: 10000,
  paymentMin: 0,
  skills: [],
  skillsById: {},
  title: "",
});

const initLocations = () => [LOCATION.ALL, LOCATION.ANY];

const initSorting = () => ({
  sortBy: SORT_BY_DEFAULT,
  sortOrder: SORT_ORDER_DEFAULT,
});

const initValues = () => ({
  paymentMax: integerFormatter.format(10000),
  paymentMin: "0",
});

const initialState = {
  abortController: abortControllerDummy,
  filters: initFilters(),
  gigs: [],
  gigsError: null,
  filteredGigsFeatured: null,
  filteredGigsHot: null,
  gigsFeatured: null,
  gigsHot: null,
  gigsSpecial: null,
  gigsSpecialError: null,
  locations: initLocations(),
  // locationSet doesn't need to be re-created on state change because
  // it is not used in any useSelector calls.
  locationSet: new Set(initLocations()),
  pagination: initPagination(),
  skillsAll: [],
  skillsById: null,
  skillsByName: null,
  skillsError: null,
  sorting: initSorting(),
  values: initValues(),
};

const IGNORED_LOCATION_SET = new Set(
  [LOCATION.ALL, LOCATION.ANY].map((loc) => loc.toLowerCase())
);

const GLOBAL_LOCATION_SET = new Set(
  [
    LOCATION.ALL,
    LOCATION.ANY,
    LOCATION.ANYWHERE,
    LOCATION.ANY_LOCATION,
  ].map((loc) => loc.toLowerCase())
);

const onAddSkill = (state, { payload: { id } }) => {
  const filtersSkillsById = state.filters.skillsById;
  if (id in filtersSkillsById) {
    return state;
  }
  const skillsById = state.skillsById;
  const skill = skillsById[id];
  if (!skill) {
    return state;
  }
  return {
    ...state,
    filters: {
      ...state.filters,
      skills: [...state.filters.skills, skill],
      skillsById: { ...filtersSkillsById, [id]: skill },
    },
    pagination: {
      ...state.pagination,
      pageNumber: 1,
    },
  };
};

const onLoadGigsSpecialError = (state, { payload: gigsSpecialError }) => ({
  ...state,
  gigsSpecial: [],
  gigsSpecialError,
});

const onLoadGigsSpecialSuccess = (state, { payload: gigsSpecial }) => {
  const skillsById = state.skillsById || {};
  const gigsFeatured = [];
  const gigsHot = [];
  let locations = state.locations;
  const locationSet = state.locationSet;
  const oldLocationCount = locationSet.size;
  for (let gig of gigsSpecial) {
    // if (!gig.location) {
    //   gig.location = LOCATION.ANYWHERE;
    // }
    // gig.isGlobal = GLOBAL_LOCATION_SET.has(gig.location.toLowerCase());
    // Aggregate speical gig location, too
    if (gig.location) {
      let lcLocation = gig.location.toLowerCase();
      if (!IGNORED_LOCATION_SET.has(lcLocation)) {
        locationSet.add(gig.location);
      }
      gig.isGlobal = GLOBAL_LOCATION_SET.has(lcLocation);
    } else {
      gig.location = LOCATION.ANYWHERE;
      gig.isGlobal = true;
    }
    if (gig.featured) {
      gigsFeatured.push(gig);
    }
    if (gig.showInHotList) {
      gigsHot.push(gig);
    }
    if (gig.skills?.length) {
      let skills = [];
      for (let skillId of gig.skills) {
        let skill = skillsById[skillId];
        if (skill) {
          skills.push(skill);
        }
      }
      gig.skills = skills;
    }
    if (oldLocationCount !== locationSet.size) {
      locations = [...locationSet].sort(sortLocations);
    }
  }
  return {
    ...state,
    filteredGigsFeatured: gigsFeatured,
    filteredGigsHot: gigsHot.slice(0, GIGS_HOT_COUNT),
    gigsFeatured,
    locations,
    gigsHot: gigsHot.slice(0, GIGS_HOT_COUNT),
    gigsSpecial,
  };
};

const onLoadPageError = (state, { payload: gigsError }) => ({
  ...state,
  abortController: null,
  gigsError,
});

const onLoadPagePending = (state, { payload: abortController }) => ({
  ...state,
  abortController,
  gigs: [],
  gigsError: null,
});

const onLoadPageSuccess = (
  state,
  { payload: { gigs, pageCount, totalCount } }
) => {
  const oldPagination = state.pagination;
  const pagination =
    oldPagination.totalCount !== totalCount ||
    oldPagination.pageCount !== pageCount
      ? { ...oldPagination, pageCount, totalCount }
      : oldPagination;

  let locations = state.locations;
  const locationSet = state.locationSet;
  const oldLocationCount = locationSet.size;
  const skillsById = state.skillsById ?? {};
  for (let gig of gigs) {
    if (gig.location) {
      let lcLocation = gig.location.toLowerCase();
      if (!IGNORED_LOCATION_SET.has(lcLocation)) {
        locationSet.add(gig.location);
      }
      gig.isGlobal = GLOBAL_LOCATION_SET.has(lcLocation);
    } else {
      gig.location = LOCATION.ANYWHERE;
      gig.isGlobal = true;
    }
    if (gig.skills?.length) {
      let skills = [];
      for (let skillId of gig.skills) {
        let skill = skillsById[skillId];
        if (skill) {
          skills.push(skill);
        }
      }
      gig.skills = skills;
    }
  }
  if (oldLocationCount !== locationSet.size) {
    locations = [...locationSet].sort(sortLocations);
  }

  return {
    ...state,
    abortController: null,
    gigs,
    locations,
    pagination,
  };
};

const onLoadSkillsError = (state, { payload: skillsError }) => ({
  ...state,
  skillsById: {},
  skillsByName: {},
  skillsError,
});

const onLoadSkillsSuccess = (state, { payload: skillsAll }) => {
  const skillsById = {};
  const skillsByName = {};
  for (let skill of skillsAll) {
    skillsById[skill.id] = skill;
    skillsByName[skill.name] = skill;
  }
  return {
    ...state,
    skillsAll,
    skillsById,
    skillsByName,
  };
};

const onResetFilters = (state) => ({
  ...state,
  filters: initFilters(),
  pagination: {
    ...state.pagination,
    pageNumber: 1,
  },
  values: initValues(),
});

const onSetLocation = (state, { payload: location }) =>
  location === state.filters.location
    ? state
    : {
        ...state,
        filters: { ...state.filters, location },
        pagination: { ...state.pagination, pageNumber: 1 },
      };

const onSetPageNumber = (state, { payload: pageNumber }) => ({
  ...state,
  pagination:
    pageNumber === state.pagination.pageNumber
      ? state.pagination
      : { ...state.pagination, pageNumber },
});

const onSetPageSize = (state, { payload: pageSize }) => ({
  ...state,
  pagination:
    pageSize === state.pagination.pageSize
      ? state.pagination
      : { ...state.pagination, pageNumber: 1, pageSize },
});

const onSetPaymentMax = (state, { payload: paymentMax }) =>
  paymentMax === state.filters.paymentMax
    ? state
    : {
        ...state,
        filters: { ...state.filters, paymentMax },
        pagination: { ...state.pagination, pageNumber: 1 },
      };

const onSetPaymentMin = (state, { payload: paymentMin }) =>
  paymentMin === state.filters.paymentMin
    ? state
    : {
        ...state,
        filters: { ...state.filters, paymentMin },
        pagination: { ...state.pagination, pageNumber: 1 },
      };

const onSetPaymentMaxValue = (state, { payload: paymentMax }) => ({
  ...state,
  values: {
    ...state.values,
    paymentMax,
  },
});

const onSetPaymentMinValue = (state, { payload: paymentMin }) => ({
  ...state,
  values: {
    ...state.values,
    paymentMin,
  },
});

const onSetSkills = (state, { payload: skills }) => {
  const skillsById = {};
  for (let skill of skills) {
    skillsById[skill.id] = skill;
  }
  return {
    ...state,
    filters: {
      ...state.filters,
      skills,
      skillsById,
    },
    pagination: {
      ...state.pagination,
      pageNumber: 1,
    },
  };
};

const onSetSorting = (
  state,
  { payload: { sortBy = SORT_BY_DEFAULT, sortOrder = SORT_ORDER_DEFAULT } }
) => {
  const sorting = state.sorting;
  if (sorting.sortBy === sortBy && sorting.sortOrder === sortOrder) {
    return state;
  }
  return {
    ...state,
    pagination: {
      ...state.pagination,
      pageNumber: 1,
    },
    sorting: {
      sortBy,
      sortOrder,
    },
  };
};

const onSetTitle = (state, { payload: title }) =>
  title === state.filters.title
    ? state
    : {
        ...state,
        filters: { ...state.filters, title },
        pagination: { ...state.pagination, pageNumber: 1 },
      };

const onUpdateStateFromQuery = (state, { payload: query }) =>
  updateStateFromQuery(state, query);

const onUpdateFilteredSpecialGigs = (state) => {
  const filteredGigsFeatured = clientSideFilters(state, "gigsFeatured");
  const filteredGigsHot = clientSideFilters(state, "gigsHot");
  return {
    ...state,
    filteredGigsFeatured,
    filteredGigsHot,
  };
};

export default handleActions(
  {
    [ACTION_TYPE.ADD_SKILL]: onAddSkill,
    [ACTION_TYPE.LOAD_GIGS_SPECIAL_ERROR]: onLoadGigsSpecialError,
    [ACTION_TYPE.LOAD_GIGS_SPECIAL_SUCCESS]: onLoadGigsSpecialSuccess,
    [ACTION_TYPE.LOAD_PAGE_ERROR]: onLoadPageError,
    [ACTION_TYPE.LOAD_PAGE_PENDING]: onLoadPagePending,
    [ACTION_TYPE.LOAD_PAGE_SUCCESS]: onLoadPageSuccess,
    [ACTION_TYPE.LOAD_SKILLS_ERROR]: onLoadSkillsError,
    [ACTION_TYPE.LOAD_SKILLS_SUCCESS]: onLoadSkillsSuccess,
    [ACTION_TYPE.RESET_FILTERS]: onResetFilters,
    [ACTION_TYPE.SET_LOCATION]: onSetLocation,
    [ACTION_TYPE.SET_PAGE_NUMBER]: onSetPageNumber,
    [ACTION_TYPE.SET_PAGE_SIZE]: onSetPageSize,
    [ACTION_TYPE.SET_PAYMENT_MAX]: onSetPaymentMax,
    [ACTION_TYPE.SET_PAYMENT_MAX_VALUE]: onSetPaymentMaxValue,
    [ACTION_TYPE.SET_PAYMENT_MIN]: onSetPaymentMin,
    [ACTION_TYPE.SET_PAYMENT_MIN_VALUE]: onSetPaymentMinValue,
    [ACTION_TYPE.SET_SKILLS]: onSetSkills,
    [ACTION_TYPE.SET_SORTING]: onSetSorting,
    [ACTION_TYPE.SET_TITLE]: onSetTitle,
    [ACTION_TYPE.UPDATE_STATE_FROM_QUERY]: onUpdateStateFromQuery,
    [ACTION_TYPE.UPDATE_FILTERED_SPECIAL_GIGS]: onUpdateFilteredSpecialGigs,
  },
  initialState,
  { prefix: "GIGS", namespace: "--" }
);
