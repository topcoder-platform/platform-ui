/**
 * Dropdown component.
 */
import React, { useState, useRef, useEffect } from 'react';
import PT from 'prop-types';
import _ from 'lodash';
import ReactSelect, { components } from 'react-select';
import styles from './styles.scss';
import iconDown from '../../assets/icons/dropdown-arrow.png';
import config from '../../../config';
import cn from 'classnames';

const Menu = (props) => {
  return (
    <components.Menu
      {...props}
      className={`${props.className} Select-menu-outer`}
    >
      {props.children}
    </components.Menu>
  );
};
const MenuList = (props) => {
  return (
    <components.MenuList
      {...props}
      className={`${props.className} Select-menu`}
    >
      {props.children}
    </components.MenuList>
  );
};

const CustomOption = (props) => {
  return (
    <components.Option
      {...props}
      className={cn(props.className, 'Select-option', {
        'is-selected': props.isSelected,
        'is-focused': props.isFocused,
      })}
    >
      {props.children}
    </components.Option>
  );
};

const ValueContainer = ({ children, ...props }) => (
  <components.ValueContainer
    {...props}
    className={`${props.className} Select-value`}
  >
    {children}
  </components.ValueContainer>
);

const Input = (props) => {
  return (
    <components.Input
      {...props}
      className={`${props.className} Select-input  Input`}
    />
  );
};

const SingleValue = ({ children, ...props }) => (
  <components.SingleValue
    {...props}
    className={`${props.className} Select-value-label`}
  >
    {children}
  </components.SingleValue>
);

const ControlComponent = (props) => (
  <components.Control
    {...props}
    className={`${props.className} Select-control`}
  />
);
const IndicatorSeparator = () => {
  return null;
};

function Dropdown({
  className,
  options,
  label,
  required,
  placeholder,
  onChange,
  errorMsg,
  searchable,
  size,
}) {
  const [internalOptions, setInternalOptions] = useState(options);
  const selectedOption = _.find(internalOptions, { selected: true });
  const [focused, setFocused] = useState(false);
  const delayedOnChange = useRef(
    _.debounce((q, cb) => cb(q), config.GUIKIT.DEBOUNCE_ON_CHANGE_TIME) // eslint-disable-line no-undef
  ).current;
  const sizeStyle = size === 'lg' ? 'lgSize' : 'xsSize';
  useEffect(() => {
    setInternalOptions(options);
  }, [options]);
  return (
    <div
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={() => setFocused(false)}
      className={[styles["dropdownContainer"], styles["container"], 
        styles['dropdownContainer'],
        styles['container'],
        styles[sizeStyle],
        selectedOption ? styles['haveValue'] : '',
        className,
        styles[className],
        focused ? styles['isFocused'] : '',
        errorMsg ? 'haveError' : '',
      ].join(' ')}
    >
      <div className={styles['relative']}>
        <ReactSelect
          autosize={false}
          autoBlur
          searchable={searchable}
          options={internalOptions.map((o) => ({
            value: o.label,
            label: o.label,
          }))}
          value={selectedOption}
          components={{
            Menu,
            MenuList,
            Option: CustomOption,
            ValueContainer,
            SingleValue,
            IndicatorSeparator,
            Input,
            Control: ControlComponent,
          }}
          onChange={(value) => {
            if (value) {
              const newOptions = internalOptions.map((o) => ({
                selected: value.label === o.label,
                label: o.label,
                value: o.value,
              }));
              setInternalOptions(newOptions);
              delayedOnChange(_.cloneDeep(newOptions), onChange);
            }
          }}
          placeholder={`${placeholder}${placeholder && required ? ' *' : ''}`}
          isClearable={false}
        />
      </div>
      {label ? (
        <span className={[styles['label'], styles['dropdownLabel']].join(' ')}>
          {label}
          {required ? <span>&nbsp;*</span> : null}
        </span>
      ) : null}
      {errorMsg ? (
        <span
          className={[styles['errorMessage'], styles['errorMsg']].join(' ')}
        >
          {errorMsg}
        </span>
      ) : null}
    </div>
  );
}

Dropdown.defaultProps = {
  placeholder: '',
  label: '',
  required: false,
  onChange: () => {},
  errorMsg: '',
  searchable: true,
  size: 'lg',
};

Dropdown.propTypes = {
  options: PT.arrayOf(
    PT.shape({
      label: PT.string,
      selected: PT.bool,
    })
  ).isRequired,
  placeholder: PT.string,
  label: PT.string,
  required: PT.bool,
  onChange: PT.func,
  errorMsg: PT.string,
  size: PT.oneOf(['xs', 'lg']),
};

export default Dropdown;
