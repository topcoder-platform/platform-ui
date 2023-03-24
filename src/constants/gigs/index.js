import * as API_SORT_BY from "./apiSortBy";
import * as LOCATION from "./location";
import * as SORT_BY from "./sortBy";
import * as SORT_ORDER from "./sortOrder";
import config from "../../../config";

export { LOCATION, SORT_BY, SORT_ORDER };

export const GIGS_API_URL = `${config.URL.PLATFORM_WEBSITE_URL}${config.API_BASE_PATH}/jobs`;

export const GIGS_HOT_COUNT = 3;
export const GIGS_HOT_INDEX = 1; // gigs' hotlist is displayed after this index

export const PAGE_SIZES = [10, 20, 50, 100];

export const PAYMENT_MAX_VALUE = 1e15;

export const SORT_BY_DEFAULT = SORT_BY.DATE_ADDED;
export const SORT_ORDER_DEFAULT = SORT_ORDER.DESC;

export const SORT_BY_TO_API = {
  [SORT_BY.DATE_ADDED]: API_SORT_BY.DATE_ADDED,
  [SORT_BY.DATE_UPDATED]: API_SORT_BY.DATE_UPDATED,
};

// maps state keys to URL parameter names in search query
export const URL_QUERY_PARAMS_MAP = new Map([
  ["title", "title"],
  ["location", "location"],
  ["paymentMin", "pay_min"],
  ["paymentMax", "pay_max"],
  ["sortBy", "by"],
  ["sortOrder", "order"],
  ["pageSize", "perpage"],
  ["pageNumber", "page"],
]);

export const FREQUENCY_TO_PERIOD = {
  daily: "day",
  hourly: "hour",
  weekly: "week",
};
