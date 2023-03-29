import React, { useRef, useEffect, useState } from "react";
import PT from "prop-types";
import _ from "lodash";
import TextInput from "../../TextInput";
import CalendarIcon from "../../../assets/icons/icon-calendar.svg";

import "./styles.scss";

const DateInput = ({
  id,
  isStartDateActive,
  startDateString,
  onStartDateChange,
  onStartDateFocus,
  isEndDateActive,
  endDateString,
  onEndDateChange,
  onEndDateFocus,
  error,
  onClickCalendarIcon,
  onStartEndDateChange,
  placeholder,
  enterToSubmit,
}) => {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);

  let rangeText;
  if (startDateString && endDateString) {
    rangeText = `${startDateString} - ${endDateString}`;
  } else {
    rangeText = `${startDateString}${endDateString}`;
  }

  useEffect(() => {
    const inputElement = ref.current.querySelector("input");
    const onFocus = () => setFocused(true);
    const onBlur = () => setFocused(false);

    inputElement.addEventListener("focus", onFocus);
    inputElement.addEventListener("blur", onBlur);

    return () => {
      inputElement.removeEventListener("focus", onFocus);
      inputElement.removeEventListener("blur", onBlur);
    };
  }, []);

  const latestPropsRef = useRef(null);
  latestPropsRef.current = { onStartDateFocus, onEndDateFocus };

  useEffect(() => {
    const inputElement = ref.current.querySelector("input");

    let caretPosition;
    if (inputElement.selectionDirection === "forward") {
      caretPosition = inputElement.selectionEnd;
    } else {
      caretPosition = inputElement.selectionStart;
    }

    if (caretPosition < 14) {
      latestPropsRef.current.onStartDateFocus();
    } else {
      latestPropsRef.current.onEndDateFocus();
    }
  }, [focused]);

  const onChangeRangeText = (value) => {
    let [newStartDateString = "", newEndDateString = ""] = value
      .trim()
      .split("-");
    newStartDateString = newStartDateString.trim();
    newEndDateString = newEndDateString.trim();

    if (
      newStartDateString !== startDateString &&
      newEndDateString !== endDateString
    ) {
      const event = {
        startDateString: newStartDateString,
        endDateString: newEndDateString,
      };
      onStartEndDateChange(event);
      onStartDateFocus();
    } else if (newStartDateString !== startDateString) {
      onStartDateFocus();
      onStartDateChange(newStartDateString);
    } else if (newEndDateString !== endDateString) {
      onEndDateFocus();
      onEndDateChange(newEndDateString);
      if (newEndDateString === "") {
        onStartDateFocus();
      }
    }
  };

  const onChangeRangeTextDebounced = useRef(_.debounce((f) => f(), 1000));

  const onClickIcon = (event) => {
    event.stopPropagation();

    const inputElement = ref.current.querySelector("input");

    let caretPosition;
    if (inputElement.selectionDirection === "forward") {
      caretPosition = inputElement.selectionEnd;
    } else {
      caretPosition = inputElement.selectionStart;
    }

    if (caretPosition < 14 || caretPosition === rangeText.length) {
      onClickCalendarIcon("start");
    } else {
      onClickCalendarIcon("end");
    }
  };

  const label = startDateString ? "From" : endDateString ? "To" : "From";

  return (
    <div styleName={`container ${error ? "isError" : ""}`}>
      <div styleName="date-range-input input-group" ref={ref}>
        <TextInput
          label={label}
          size="xs"
          value={rangeText}
          onChange={(value) => {
            if (!enterToSubmit) {
              onChangeRangeTextDebounced.current(() =>
                onChangeRangeText(value)
              );
            }
          }}
          onEnterKey={(value) => {
            onChangeRangeText(value);
          }}
          placeholder={placeholder}
        />
        <button id={id} styleName="icon" onClick={onClickIcon}>
          <CalendarIcon />
        </button>
      </div>
      <div styleName="errorHint">{error}</div>
    </div>
  );
};

DateInput.propTypes = {
  id: PT.string,
  isStartDateActive: PT.bool,
  startDateString: PT.string,
  onStartDateChange: PT.func,
  onStartDateFocus: PT.func,
  isEndDateActive: PT.bool,
  endDateString: PT.string,
  onEndDateChange: PT.func,
  onEndDateFocus: PT.func,
  error: PT.string,
  onClickCalendarIcon: PT.func,
  onStartEndDateChange: PT.func,
  placeholder: PT.string,
};

export default DateInput;
