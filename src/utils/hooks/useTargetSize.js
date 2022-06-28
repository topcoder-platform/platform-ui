import React from "react";

export const useTargetSize = () => {
  const [size, setSize] = React.useState();
  const ref = React.useRef();

  React.useLayoutEffect(() => {
    setSize(ref.current.getBoundingClientRect());
  }, []);

  React.useLayoutEffect(() => {
    const targetNode = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentBoxSize) {
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;
          setSize({
            width: Math.floor(contentBoxSize.inlineSize),
            height: Math.floor(contentBoxSize.blockSize),
          });
        }
      }
    });
    resizeObserver.observe(targetNode);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return [size, ref];
};
