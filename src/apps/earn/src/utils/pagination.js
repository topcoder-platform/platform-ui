export function pageToPageIndex(page) {
  return page - 1;
}

export function pageIndexToPage(pageIndex) {
  return pageIndex + 1;
}

/**
 * @param {any} response Web APIs Response
 * @return {Object} pagination data
 */
export function getResponseHeaders(response) {
  return {
    page: +(response.headers.get("X-Page") || 0),
    perPage: +(response.headers.get("X-Per-Page") || 0),
    total: +(response.headers.get("X-Total") || 0),
    totalPages: +(response.headers.get("X-Total-Pages") || 0),
  };
}
