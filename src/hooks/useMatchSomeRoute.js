import { matchPath, useLocation } from "@reach/router";
import _ from "lodash";

/**
 * Check if any of the passed paths match the current route.
 *
 * @param {string[]} paths paths of the routes
 *
 * @returns {{ uri: string, path: string, params: {} }} matched route params
 */
const useMatchSomeRoute = (paths) => {
  const location = useLocation();
  return _.find(paths, (path) => {
    const result = matchPath(path, location.pathname);

    return result
      ? {
          params: result.params,
          uri: result.uri,
          path,
        }
      : null;
  });
};

export default useMatchSomeRoute;
