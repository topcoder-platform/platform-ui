import { GIGS_API_URL } from "../../constants/gigs";
import { convertToApiBody, convertToApiQuery } from "../../utils/gigs/gigs/api";

/**
 * Fetches gigs from API.
 *
 * @param {Object} params
 * @param {AbortController} [controller]
 * @returns {[Promise, AbortController]}
 */
export const fetchGigs = (params, controller) => {
  if (!controller) {
    controller = new AbortController();
  }
  if (!params.pageNumber) {
    params.pageNumber = 1;
  }
  if (!params.pageSize) {
    params.pageSize = 10;
  }
  const promise = fetch(
    `${GIGS_API_URL}?${convertToApiQuery(
      params
    )}&isApplicationPageActive=true&rcrmStatus=Open`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: convertToApiBody(params),
      signal: controller.signal,
    }
  ).then((response) => {
    if (response.status !== 200) {
      throw new Error("Failed to fetch gigs.");
    }
    const headers = response.headers;
    let pageCount = +headers.get("X-Total-Pages") || 0;
    let pageNumber = +headers.get("X-Page") || 1;
    let pageSize = +headers.get("X-Per-Page") || 10;
    let totalCount = +headers.get("X-Total") || 0;
    return response.json().then((data) => ({
      data,
      pagination: { pageCount, pageNumber, pageSize, totalCount },
    }));
  });
  return [promise, controller];
};
