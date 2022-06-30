import { useLocation } from "react-router-dom";
import React from "react";

export const ScrollToTop = ({ children }) => {
  const location = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [location?.pathname]);
  return children;
};
