/* global document */

/**
 * This generic component will implement the semi-transparent background
 * and the white window in the center, which wraps the content provided as
 * children.
 *
 * When semi-transparent background is clicked, it should trigger the onCancel()
 * callback passed from the parent.
 */

import _ from "lodash";
import React, { useEffect, useRef } from "react";
import ReactDom from "react-dom";
import PT from "prop-types";
import { themr } from "react-css-super-themr";

import defaultStyle from "./style.scss";

const Modal = ({ children, onCancel, theme }) => {
  const portalRef = useRef();
  if (!portalRef.current) {
    portalRef.current = document.createElement("div");
  }

  useEffect(() => {
    document.body.classList.add("scrolling-disabled-by-modal");
    document.body.appendChild(portalRef.current);

    return () => {
      document.body.classList.remove("scrolling-disabled-by-modal");
      document.body.removeChild(portalRef.current);
    };
  }, []);

  return ReactDom.createPortal(
    <React.Fragment>
      <div
        className={theme.container}
        onWheel={(event) => event.stopPropagation()}
      >
        {children}
      </div>
      <button
        onClick={() => onCancel()}
        className={theme.overlay}
        type="button"
      />
    </React.Fragment>,
    portalRef.current
  );
};

Modal.defaultProps = {
  onCancel: _.noop,
  children: null,
  theme: {},
};

Modal.propTypes = {
  onCancel: PT.func,
  children: PT.node,
  theme: PT.shape(),
};

/* Non-themed version of the Modal. */
export const BaseModal = Modal;

export default themr("Modal", defaultStyle)(Modal);
