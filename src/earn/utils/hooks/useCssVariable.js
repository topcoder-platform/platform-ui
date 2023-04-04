import React, { useMemo } from "react";

export const useCssVariable = (name, transformFunc) => {
  const value = useMemo(() => {
    const htmlElement = document.getElementsByTagName("html").item(0);
    const style = getComputedStyle(htmlElement);
    const val = style.getPropertyValue(name);

    return transformFunc ? transformFunc(val) : val;
  }, [name, transformFunc]);

  return value;
};
