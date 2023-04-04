import { useEffect, useRef } from "react";

/**
 * A hook that calls effect only if dependencies are changed. It does not call
 * the effect on mount.
 *
 * @param {function} effect function to be called
 * @param {Array} deps dependencies
 */
export const useUpdateEffect = (effect, deps) => {
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) {
      return effect();
    } else {
      isMountedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
