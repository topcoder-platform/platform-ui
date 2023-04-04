import React from "react";

export const useClickOutside = (open, onClickOutside) => {
  const ref = React.useRef(null);
  const onClickOutsideRef = React.useRef(onClickOutside);

  React.useLayoutEffect(() => {
    onClickOutsideRef.current = onClickOutside;
  }); // no dependecies

  const handleClickOutside = React.useCallback((event) => {
    let inside;
    if (event.composedPath) {
      inside = event.composedPath().indexOf(ref.current) !== -1;
    } else {
      inside =
        !document.documentElement.contains(event.target) ||
        ref.current.contains(event.target);
    }

    if (!inside) {
      onClickOutsideRef.current(event);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [open, handleClickOutside]);

  return ref;
};
