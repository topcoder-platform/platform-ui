/**
 * DateInput
 *
 * Date Input control.
 */
import React, { createRef, useState } from "react";
import PT from "prop-types";
import DatePicker from "react-datepicker";
import cn from "classnames";
import "react-datepicker/dist/react-datepicker.css";
import CalendarIcon from "../../assets/images/icon-calendar.svg";
import ArrowIcon from "../../assets/images/icon-arrow.svg";
import styles from "./styles.module.scss";
import moment from "moment";

const DateInput = (props) => {
  const [open, setOpen] = useState(false);
  const calendarRef = createRef();
  return (
    <div
      styleName={cn(
        "styles.datepicker-wrapper",
        props.className,
        props.style2 ? "styles.style2" : ""
      )}
    >
      <div
        onClick={() => calendarRef.current.setOpen(true)}
        styleName={cn("styles.icon", "styles.icon-calendar")}
        role="button"
        tabIndex={0}
      >
        <CalendarIcon />
      </div>
      <DatePicker
        ref={calendarRef}
        dateFormat="MM/dd/yyyy"
        placeholderText={props.placeholder}
        selected={props.value}
        onChange={props.onChange}
        onBlur={props.onBlur}
        onCalendarClose={() => {
          setOpen(false);
        }}
        onFocus={props.onFocus}
        showYearDropdown
        onCalendarOpen={() => setOpen(true)}
        maxDate={
          props.allowFutureDate ? null : moment().subtract(1, "days").toDate()
        }
        disabled={props.disabled}
      />
      <div
        styleName={cn(
          "styles.icon",
          "styles.icon-arrow",
          open ? "styles.icon-arrow-open" : ""
        )}
        onClick={() => calendarRef.current.setOpen(true)}
        role="button"
        tabIndex={0}
      >
        <ArrowIcon />
      </div>
    </div>
  );
};

DateInput.propTypes = {
  value: PT.string,
  onChange: PT.func.isRequired,
  placeholder: PT.string,
  onBlur: PT.func,
  onFocus: PT.func,
  className: PT.string,
  style2: PT.bool,
  disabled: PT.bool,
  allowFutureDate: PT.bool,
};

export default DateInput;
