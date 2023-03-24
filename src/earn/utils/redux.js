/**
 * Redux-related helpers.
 */

/**
 * Reduce multiple reducers into a single reducer from left to right.
 * Function-type reducers will be called directly with current state, and action
 * Object type reducers (eg: `{submissions: (state, action) => {}}`)
 *   will be called with the state's slice corresponding to object's key
 *   eg: `{submissions}` will be called with `submissions(state.submissions, action)`
 *
 * @params {function|Object} the reducers to be combined
 * @return function the unified reducer
 */
/* TODO: Can we simplify this function? */
export function combineReducers(...reducers) {
  return (state, action) => {
    const nextState = {};
    const mergeState = Object.assign.bind(Object, nextState);

    reducers.forEach((reducer) => {
      if (typeof reducer === "function") {
        return mergeState(reducer(state, action));
      }

      Object.keys(reducer).forEach((slice) => {
        mergeState({ [slice]: reducer[slice]((state || {})[slice], action) });
      });
      return undefined;
    });

    return nextState;
  };
}
