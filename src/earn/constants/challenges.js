export const PAGINATION_PER_PAGES = [10, 20, 50];
export const PAGINATION_MAX_PAGE_DISPLAY = 3;

/*
 * Challenge Status
 */
export const CHALLENGE_STATUS = {
  ACTIVE: "Active",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  DRAFT: "Draft",
};

export const FILTER_BUCKETS = [
  "All Active Challenges",
  "Open for Registration",
  "Closed Challenges",
];

export const FILTER_CHALLENGE_TYPES = ["Challenge", "First2Finish", "Task"];

export const FILTER_CHALLENGE_TYPE_ABBREVIATIONS = {
  Challenge: "CH",
  First2Finish: "F2F",
  Task: "TSK",
};

export const FILTER_CHALLENGE_TRACKS = [
  "Design",
  "Development",
  "Data Science",
  "Quality Assurance",
];

export const FILTER_CHALLENGE_TRACK_ABBREVIATIONS = {
  Design: "DES",
  Development: "DEV",
  "Data Science": "DS",
  "Quality Assurance": "QA",
};

export const CHALLENGE_SORT_BY = {
  // "Best Match": "bestMatch",
  "Most recent": "updated",
  "Prize amount": "overview.totalPrizes",
  Title: "name",
};

export const CHALLENGE_SORT_BY_RECOMMENDED = "bestMatch";
export const CHALLENGE_SORT_BY_RECOMMENDED_LABEL = "Best Match";
export const CHALLENGE_SORT_BY_MOST_RECENT = "updated";
export const CHALLENGE_SORT_ORDER_DEFAULT = "desc";
export const CHALLENGES_URL = "/earn/find/challenges";

export const SORT_ORDER = {
  DESC: "desc",
  ASC: "asc",
};

export const SORT_BY_SORT_ORDER = {
  // bestMatch: SORT_ORDER.DESC,
  updated: SORT_ORDER.DESC,
  "overview.totalPrizes": SORT_ORDER.DESC,
  name: SORT_ORDER.ASC,
};

export const TRACK_COLOR = {
  Design: "#2984BD",
  Development: "#35AC35",
  "Data Science": "#F46500",
  "Quality Assurance": "#35AC35",
};

export const CURRENCY_SYMBOL = {
  EUR: "€",
  INR: "₹",
  USD: "$",
};

export const ACCESS_DENIED_REASON = {
  NOT_AUTHENTICATED: "Not authenticated",
  NOT_AUTHORIZED: "Not authorized",
  HAVE_NOT_SUBMITTED_TO_THE_CHALLENGE:
    "You have not submitted to this challenge",
};

/**
 * Codes of the Topcoder communities.
 */
/* TODO: These are originally motivated by Topcoder API v2. Topcoder API v3
 * uses upper-case literals to encode the tracks. At some point, we should
 * update it in this code as well! */
export const COMPETITION_TRACKS = {
  DS: "Data Science",
  DES: "Design",
  DEV: "Development",
  QA: "Quality Assurance",
};

export const TOKEN_COOKIE_KEYS = {
  V3JWT: "v3jwt",
  TCJWT: "tcjwt",
  TCSSO: "tcsso",
};
