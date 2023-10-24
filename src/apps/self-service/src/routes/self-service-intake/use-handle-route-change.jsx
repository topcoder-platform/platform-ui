import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const useHandleRouteChange = () => {
  let location = useLocation()

  useEffect(
    () => {
      if (location.pathname.indexOf('/review') >= 0) {
        window.scrollTo(0, 0);
      }
    },
    [location.pathname]
  )
}
