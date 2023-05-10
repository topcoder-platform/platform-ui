//import "react-select/dist/react-select.css";
import styles from './styles.scss';
import React, { useState } from 'react';
import PT from 'prop-types';
import Select, { components } from 'react-select';
import cn from 'classnames';
import iconDown from '../../assets/icons/dropdown-arrow.png';

const Arrow = () => (
  <img className={styles['arrow']} src={iconDown} alt="icon down" />
);

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
    className={`${props.className} Select-multi-value-wrapper`}
  >
    {children}
  </components.ValueContainer>
);

const ControlComponent = (props) => {
  return (
    <components.Control
      {...props}
      className={`${props.className} Select-control`}
    />
  );
};
const IndicatorsContainer = (props) => {
  return (
    <components.IndicatorsContainer
      {...props}
      className={`${props.className} IndicatorsContainer`}
    />
  );
};
const SelectContainer = (props) => {
  return (
    <components.Control
      {...props}
      className={cn(props.className, 'SelectContainer', {
        'is-focused': props.isFocused,
      })}
    />
  );
};

const MultiValueContainer = (props) => {
  return (
    <components.MultiValueContainer
      {...props}
      innerProps={{
        ...props.innerProps,
        className: `${props.className} Select-value MultiValueContainer`,
      }}
    />
  );
};

const MultiValueLabel = (props) => {
  return (
    <components.MultiValueLabel
      {...props}
      innerProps={{
        ...props.innerProps,
        className: `${props.className} Select-value-label  MultiValueLabel`,
      }}
    />
  );
};

const MultiValueRemove = ({ children, ...props }) => (
  <components.MultiValueRemove
    {...props}
      innerProps={{
        ...props.innerProps,
        className: `${props.className} MultiValueRemove`,
      }}
  >
    {children}
  </components.MultiValueRemove>
);

const Input = (props) => {
  return (
    <components.Input
      {...props}
      className={`${props.className} Select-input  Input`}
    />
  );
};

const Placeholder = (props) => {
  return (
    <components.Placeholder
      {...props}
      className={`${props.className} Select-placeholder  Placeholder`}
    />
  );
};

const IndicatorSeparator = () => {
  return null;
};
const DropdownIndicator = () => {
  return null;
};

/**
 * Displays a multi-select field.
 *
 * @param {Object} props component properties
 * @returns {JSX.Element}
 */
const MultiSelect = ({
  className,
  clearable,
  label,
  isRequired = false,
  onChange,
  onFocus,
  options,
  optLabelKey,
  optValueKey,
  placeholder,
  showArrow = false,
  size,
  value,
  error,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <>
      <div
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        className={[
          styles.container,
          styles[size],
          className,
          !!error ? styles['hasError'] : '',
        ].join(' ')}
      >
        {label && (
          <span
            className={[
              styles['label'],
              focused && !error ? styles['focused'] : '',
            ].join(' ')}
          >
            {label + (isRequired ? ' *' : '')}
          </span>
        )}
        <Select
          className={cn(styles.select, 'Select', {
            [styles.hasValues]: value && value.length ? true : false,
          })}
          clearable={clearable}
          getOptionLabel={(item) => item[optLabelKey]}
          getOptionValue={(item) => item[optValueKey]}
          isMulti={true}
          onChange={onChange}
          onFocus={onFocus}
          options={options}
          value={value}
          placeholder={placeholder}
          components={{
            Menu,
            MenuList,
            Option: CustomOption,
            ValueContainer,
            Control: ControlComponent,
            IndicatorsContainer,
            MultiValueContainer,
            MultiValueLabel,
            Input,
            Placeholder,
            IndicatorSeparator,
            DropdownIndicator: showArrow ? null : DropdownIndicator,
            SelectContainer,
            MultiValueRemove,
          }}
        />
      </div>
      {error && <div className={styles.error}>{error}</div>}
    </>
  );
};

MultiSelect.propTypes = {
  className: PT.string,
  label: PT.string,
  onChange: PT.func.isRequired,
  options: PT.array.isRequired,
  optLabelKey: PT.string,
  optValueKey: PT.string,
  placeholder: PT.string,
  value: PT.array.isRequired,
};

export default MultiSelect;
