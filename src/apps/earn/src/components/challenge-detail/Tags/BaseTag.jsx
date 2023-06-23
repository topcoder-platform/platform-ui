/**
 * This component provide a standard button / button-like link:
 * - When disabled, it renders as <div>;
 * - When no "to" prop is passed in, it renders as <button>;
 * - Otherwise, it renders as <Link>.
 */

import classNames from 'classnames';
import PT from 'prop-types';

import { LinkButton } from '~/libs/ui';

export default function BaseTag(props) {
  let className = classNames(
    props.className,
    props.theme.button,
    props.theme[props.size],
    props.active && props.theme.active,
    props.disabled && props.theme.disabled,
    props.to && props.theme.link,
    props.theme.regular,
  )

  return <LinkButton
    {...props}
    className={className}
  />
}

BaseTag.defaultProps = {
  active: false,
  children: null,
  disabled: false,
  enforceA: false,
  onClick: null,
  onMouseDown: null,
  openNewTab: false,
  replace: false,
  size: null,
  to: null,
  type: 'button',
};

BaseTag.propTypes = {
  active: PT.bool,
  children: PT.node,
  disabled: PT.bool,
  enforceA: PT.bool,
  onClick: PT.func,
  onMouseDown: PT.func,
  openNewTab: PT.bool,
  replace: PT.bool,
  size: PT.string,
  theme: PT.shape({
    button: PT.string.isRequired,
    disabled: PT.string,
    link: PT.string,
    regular: PT.string,
  }).isRequired,
  to: PT.oneOfType([PT.object, PT.string]),
  type: PT.oneOf(['button', 'reset', 'submit']),
};
