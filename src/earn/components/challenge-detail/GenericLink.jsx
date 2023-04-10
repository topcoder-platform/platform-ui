/**
 * The GenericLink wraps around React Router's Link or NavLink component, to
 * automatically replace them by regular <a> elements when:
 * - The target reference points to another domain;
 * - User opts to open the reference in a new tab;
 * - User explicitely opts to use <a>.
 */

/* global window */

import _ from 'lodash';
import PT from 'prop-types';
import React from 'react';

export default function GenericLink(props) {
  const {
    children,
    className,
    enforceA,
    onClick,
    onMouseDown,
    openNewTab,
    replace,
    routerLinkType,
    to,
  } = props;

  /* Renders Link as <a> element if:
   * - It is opted explicitely by `enforceA` prop;
   * - It should be opened in a new tab;
   * - It is an absolte URL (starts with http:// or https://);
   * - It is anchor link (starts with #). */
  if (enforceA || openNewTab || to.match(/^(#|https?:\/\/)/)) {
    return (
      <a
        className={className}
        href={to}
        onClick={onClick}
        onMouseDown={onMouseDown}
        rel="noopener noreferrer"
        target={openNewTab ? '_blank' : ''}
      >
        {children}
      </a>
    );
  }

  const linkProps = _.omit(props, [
    'children',
    'enforceA',
    'openNewTab',
    'routerLinkType',
  ]);

  /* Otherwise we render the link as React Router's Link or NavLink element. */
  return React.createElement(routerLinkType, {
    ...linkProps,
    replace,
    onClick: (e) => {
      /* If a custom onClick(..) handler was provided we execute it. */
      if (onClick) onClick(e);

      /* The link to the current page will scroll to the top of the page. */
      window.scroll(0, 0);
    },
  }, children);
}

GenericLink.defaultProps = {
  children: null,
  className: null,
  enforceA: false,
  onClick: null,
  onMouseDown: null,
  openNewTab: false,
  replace: false,
  to: '',
};

GenericLink.propTypes = {
  children: PT.node,
  className: PT.string,
  enforceA: PT.bool,
  onClick: PT.func,
  onMouseDown: PT.func,
  openNewTab: PT.bool,
  replace: PT.bool,
  routerLinkType: PT.func.isRequired,
  to: PT.oneOfType([PT.object, PT.string]),
};