import { useState } from "react";

export const useScrollLock = () => {
  const [locked, setLocked] = useState();

  return (lock) => {
    if (lock && !locked) {
      const x = document.documentElement.scrollLeft;
      const y = document.documentElement.scrollTop;
      window.onscroll = () => {
        window.scrollTo(x, y);
      };
      setLocked(true);
    } else if (locked) {
      window.onscroll = () => {};
      setLocked(false);
    }
  };
};
