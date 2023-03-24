import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export const usePreviousLocation = () => {
  const location = useLocation();
  const ref = useRef(location);

  useEffect(() => {
    ref.current = location;
  }, [location]);

  return ref.current;
};
