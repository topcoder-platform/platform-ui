import React, { useState, useEffect } from "react";
import moment from "moment";
import { DateRangePicker as ReactDateRangePicker } from "react-date-range";
import PropTypes from "prop-types";

import styles from "./style.scss";

import DateInput from "./DateInput";

import {
  useComponentVisible,
  createStaticRanges,
  isSameDay,
  isAfterDay,
  isBeforeDay,
} from "./helpers";

function DateRangePicker(props) {
  const { id, range, onChange, placeholder, enterToSubmit = false } = props;

  const [rangeString, setRangeString] = useState({
    startDateString: "",
    endDateString: "",
  });
  const [activeDate, setActiveDate] = useState(null);
  const [preview, setPreview] = useState(null);
  const [focusedRange, setFocusedRange] = useState([0, 0]);
  const [errors, setErrors] = useState({
    startDate: undefined,
    endDate: undefined,
  });

  const {
    ref: calendarRef,
    isComponentVisible,
    setIsComponentVisible,
  } = useComponentVisible(false);

  const isStartDateFocused = focusedRange[1] === 0;
  const isEndDateFocused = focusedRange[1] === 1;

  useEffect(() => {
    setRangeString({
      startDateString: range.startDate
        ? moment(range.startDate).format("MMM D, YYYY")
        : "",
      endDateString: range.endDate
        ? moment(range.endDate).format("MMM D, YYYY")
        : "",
    });
  }, [range]);

  /**
   * Handle end date change on user input
   * After user input the end date via keyboard, validate it then update the range state
   * @param {Object} e Input Event.
   */
  const onEndDateChange = (value) => {
    const endDateString = value;
    const endDate = moment(endDateString, "MMM D, YYYY", true);
    const startDate = moment(rangeString.startDateString, "MMM D, YYYY", true);

    if (endDate.isValid() && isBeforeDay(endDate, startDate)) {
      setErrors({
        ...errors,
        endDate: "Range Error",
      });
    } else if (endDate.isValid()) {
      onChange({
        endDate: endDate.toDate(),
        startDate: range.startDate,
      });

      setErrors({
        ...errors,
        endDate: "",
      });

      setRangeString({
        ...rangeString,
        endDateString: endDate.format("MMM D, YYYY"),
      });
    } else if (endDateString === "") {
      onChange({
        endDate: null,
        startDate: range.startDate,
      });

      setErrors({
        ...errors,
        endDate: "",
      });
    } else {
      setErrors({
        ...errors,
        endDate: "Invalid End Date Format",
      });

      setRangeString({
        ...rangeString,
        endDateString,
      });
    }
  };

  /**
   * Handle start date change on user input
   * After user input the start date via keyboard, validate it then update the range state
   * @param {Object} e Input Event.
   */
  const onStartDateChange = (value) => {
    const startDateString = value;
    const startDate = moment(startDateString, "MMM D, YYYY", true);
    const endDate = moment(rangeString.endDateString, "MMM D, YYYY", true);

    if (
      startDate.isValid() &&
      endDate.isValid() &&
      isAfterDay(startDate, endDate)
    ) {
      setErrors({
        ...errors,
        startDate: "Range Error",
      });
    } else if (startDate.isValid()) {
      onChange({
        endDate: range.endDate,
        startDate: startDate.toDate(),
      });

      setErrors({
        ...errors,
        startDate: "",
      });

      setRangeString({
        ...rangeString,
        startDateString: startDate.format("MMM D, YYYY"),
      });
    } else if (startDateString === "") {
      onChange({
        endDate: range.endDate,
        startDate: null,
      });

      setErrors({
        ...errors,
        startDate: "",
      });
    } else {
      setErrors({
        ...errors,
        startDate: "Invalid Start Date Format",
      });

      setRangeString({
        ...rangeString,
        startDateString,
      });
    }
  };

  const onStartEndDateChange = ({ startDateString, endDateString }) => {
    const startDate = moment(startDateString, "MMM D, YYYY", true);
    const endDate = moment(endDateString, "MMM D, YYYY", true);

    if (
      startDate.isValid() &&
      endDate.isValid() &&
      isBeforeDay(endDate, startDate)
    ) {
      setErrors({
        ...errors,
        endDate: "Range Error",
      });
    } else if (startDate.isValid() && endDate.isValid()) {
      onChange({
        endDate: endDate.toDate(),
        startDate: startDate.toDate(),
      });
      setErrors({
        startDate: "",
        endDate: "",
      });
    } else if (startDate.isValid()) {
      onChange({
        endDate: null,
        startDate: startDate.toDate(),
      });
      setErrors({
        ...errors,
        endDate: "Invalid End Date Format",
      });
    } else if (endDate.isValid()) {
      onChange({
        endDate: endDate.toDate(),
        startDate: null,
      });
      setErrors({
        ...errors,
        startDate: "Invalid Start Date Format",
      });
    } else if (startDateString === "" && endDateString === "") {
      onChange({
        endDate: null,
        startDate: null,
      });
      setErrors({
        startDate: "",
        endDate: "",
      });
    } else if (startDateString === "") {
      onChange({
        endDate: endDate.toDate(),
        startDate: null,
      });

      setErrors({
        ...errors,
        startDate: "",
      });
    } else if (endDateString === "") {
      onChange({
        endDate: null,
        startDate: startDate.toDate(),
      });

      setErrors({
        ...errors,
        endDate: "",
      });
    } else {
      onChange({
        endDate: null,
        startDate: null,
      });
      setErrors({
        startDate: "Invalid Start Date Format",
        endDate: "Invalid End Date Format",
      });
    }
  };

  /**
   * Trigger to open calendar modal on calendar icon in start date input
   */
  const onIconClickStartDate = () => {
    const calendarIcon = document.querySelector(id);
    if (calendarIcon) {
      calendarIcon.blur();
    }
    setFocusedRange([0, 0]); // set current focused input to start date
    setActiveDate(null);
    setIsComponentVisible(true);
    setPreview(null);
  };

  /**
   * Trigger to open calendar modal on calendar icon in end date input
   */
  const onIconClickEndDate = () => {
    const calendarIcon = document.querySelector(id);
    if (calendarIcon) {
      calendarIcon.blur();
    }
    setFocusedRange([0, 1]); // set current focused input to end date
    setActiveDate(null);
    setIsComponentVisible(true);
    setPreview(null);
  };

  const onReset = (presetRange) => {
    let newStartDate;
    let newEndDate;

    if (presetRange) {
      newStartDate = presetRange.startDate;
      newEndDate = presetRange.endDate;
    }

    setFocusedRange([0, 0]);

    setErrors({
      startDate: "",
      endDate: "",
    });

    setRangeString({
      startDateString: newStartDate
        ? moment(newStartDate).format("MMM D, YYYY")
        : "",
      endDateString: newEndDate ? moment(newEndDate).format("MMM D, YYYY") : "",
    });

    onChange({
      startDate: newStartDate ? moment(newStartDate) : null,
      endDate: newEndDate ? moment(newEndDate) : null,
    });

    setIsComponentVisible(false);
  };

  /**
   * Event handler on date selection changes
   * @param {Object} newRange nnew range that has endDate and startDate data
   */
  const onDateRangePickerChange = (newRange) => {
    let newEndDate = newRange.endDate;
    let newStartDate = newRange.startDate;
    const isUseKeyPress = focusedRange[0] !== 0;

    if (isUseKeyPress) {
      setFocusedRange([0, focusedRange[1]]);
    }

    let shouldCloseCalendar = true;
    let shouldOpenNextCalendar = false;

    // User is active on start date calendar modal
    if (
      isStartDateFocused &&
      (isUseKeyPress || isSameDay(newStartDate, newEndDate))
    ) {
      if (range.endDate && isAfterDay(newStartDate, range.endDate)) return;
      newEndDate = range.endDate;
      shouldCloseCalendar = false;
      shouldOpenNextCalendar = true;
      setErrors({
        ...errors,
        startDate: "",
      });
    } else if (
      isEndDateFocused &&
      (isUseKeyPress || isSameDay(newEndDate, newStartDate))
    ) {
      if (range.startDate && isBeforeDay(newEndDate, range.startDate)) return;
      newStartDate = range.startDate;
      setErrors({
        ...errors,
        endDate: "",
      });
    } else {
      setErrors({
        startDate: "",
        endDate: "",
      });
    }

    // Emit the payload

    setRangeString({
      startDateString: newStartDate
        ? moment(newStartDate).format("MMM D, YYYY")
        : "",
      endDateString: newEndDate ? moment(newEndDate).format("MMM D, YYYY") : "",
    });

    onChange({
      startDate: newStartDate,
      endDate: newEndDate ? moment(newEndDate).endOf("day").toDate() : null,
    });

    if (shouldOpenNextCalendar) {
      setFocusedRange([0, 1]);
    }
    if (shouldCloseCalendar) {
      setIsComponentVisible(false);
    }
  };

  /**
   * Event handler on preview change
   * @param {Date} date current date which user hover
   */
  const onPreviewChange = (date) => {
    if (!(date instanceof Date)) {
      setPreview(null);

      // ---
      // workaround for fixing issue 132:
      // - set the active range's background to transparent color
      // to prevent the calendar auto focusing on the day of today by default when no
      // start date nor end date are set.
      // - does not set focus on the selection range when mouse leaves.
      // ---

      // setActiveDate(null);
      // if (range.startDate || range.endDate) {
      //   setFocusedRange([0, focusedRange[1]]);
      // }
      return;
    }

    if (isStartDateFocused && date) {
      setPreview({
        startDate: date,
        endDate: range.endDate || date,
      });
    } else if (isEndDateFocused && date) {
      setPreview({
        startDate: range.startDate || date,
        endDate: date,
      });
    }

    setActiveDate(date);
    setFocusedRange([1, focusedRange[1]]);
  };

  /**
   * Event handler for user keypress
   * @param {Event} e Keyboard event
   */
  const handleKeyDown = (e) => {
    let currentActiveDate = activeDate;
    if (!currentActiveDate) {
      currentActiveDate = moment().startOf("month").toDate();

      if (isStartDateFocused && range.startDate) {
        currentActiveDate = range.startDate;
      } else if (isEndDateFocused && (range.startDate || range.endDate)) {
        currentActiveDate = range.endDate || range.startDate;
      }
    }

    switch (e.key) {
      case "Down":
      case "ArrowDown":
        currentActiveDate = moment(currentActiveDate).add(7, "days").toDate();
        onPreviewChange(currentActiveDate);
        break;
      case "Up":
      case "ArrowUp":
        currentActiveDate = moment(currentActiveDate)
          .subtract(7, "days")
          .toDate();
        onPreviewChange(currentActiveDate);
        break;
      case "Left":
      case "ArrowLeft":
        currentActiveDate = moment(currentActiveDate)
          .subtract(1, "days")
          .toDate();
        onPreviewChange(currentActiveDate);
        break;
      case "Right":
      case "ArrowRight":
        currentActiveDate = moment(currentActiveDate).add(1, "days").toDate();
        onPreviewChange(currentActiveDate);
        break;
      case "Enter":
        if (activeDate) {
          onDateRangePickerChange({
            startDate: isStartDateFocused ? activeDate : range.startDate,
            endDate: isEndDateFocused ? activeDate : range.endDate,
          });
        }
        break;
      case "Esc":
      case "Escape":
        setIsComponentVisible(false);
        break;
      default:
        return; // Quit when this doesn't handle the key event.
    }

    e.preventDefault();
  };

  /**
   * User Effect for listening to keypress event
   */
  useEffect(() => {
    if (isComponentVisible) {
      document.addEventListener("keydown", handleKeyDown, true);
    } else {
      document.removeEventListener("keydown", handleKeyDown, true);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  });

  /**
   * Focus the calendar to the given date,
   * so for example, if the user click menu for end date it will open the calendar
   * and focus it to current end date
   */
  const getShownDate = () => {
    if (activeDate) {
      return activeDate;
    }

    if (isStartDateFocused) {
      if (preview) return preview.startDate;
      return range.startDate || moment().toDate();
    }
    if (preview) return preview.endDate;
    return range.endDate || moment().toDate();
  };

  /**
   * Disable the days that cannot be selected
   */
  const disabledDay = (date) => {
    if (isStartDateFocused) {
      return range.endDate ? moment(date).isAfter(range.endDate, "day") : false;
    }
    return range.startDate
      ? moment(date).isBefore(range.startDate, "day")
      : false;
  };

  /**
   * Get Date Ranges
   */
  const getRanges = () => {
    if (activeDate) {
      return [
        {
          ...range,
          key: "selection",
          color: "#0AB88A",
        },
        {
          startDate: activeDate,
          endDate: activeDate,
          key: "active",
          color: preview ? "#D8FDD8" : "#D8FDD800",
        },
      ];
    }
    return [
      {
        ...range,
        key: "selection",
        color: "#0AB88A",
      },
    ];
  };

  /**
   * Check whether the preview invalid
   */
  const isInvalidPreview = () => {
    if (!preview) return false;
    if (isStartDateFocused) {
      return isAfterDay(preview.startDate, range.endDate);
    }
    return isBeforeDay(preview.endDate, range.startDate);
  };

  const className = `${(focusedRange[1] === 1 && styles.endDate) || ""} ${
    (range.startDate && range.endDate && styles.isRange) || ""
  } ${(isInvalidPreview() && styles.isInvalidPreview) || ""} ${
    ((errors.startDate || errors.endDate) && styles.isErrorInput) || ""
  }`;

  return (
    <div styleName="dateRangePicker" className={className}>
      <div styleName="dateInputWrapper">
        <DateInput
          id={id}
          isStartDateActive={focusedRange[1] === 0 && isComponentVisible}
          startDateString={rangeString.startDateString}
          onStartDateChange={onStartDateChange}
          onStartDateFocus={() => setFocusedRange([0, 0])}
          isEndDateActive={focusedRange[1] === 1 && isComponentVisible}
          endDateString={rangeString.endDateString}
          onEndDateChange={onEndDateChange}
          onEndDateFocus={() => setFocusedRange([0, 1])}
          error={errors.startDate || errors.endDate}
          onClickCalendarIcon={(event) => {
            event === "start" ? onIconClickStartDate() : onIconClickEndDate();
          }}
          onStartEndDateChange={onStartEndDateChange}
          placeholder={placeholder}
          enterToSubmit={enterToSubmit}
        />
      </div>
      <div ref={calendarRef} styleName="calendar-container">
        {isComponentVisible && (
          <div styleName="calendar-inner-container">
            <ReactDateRangePicker
              focusedRange={focusedRange}
              onRangeFocusChange={setFocusedRange}
              onChange={(item) => {
                if (!preview) {
                  onReset(item.selection || item.active);
                } else {
                  onDateRangePickerChange(item.selection || item.active);
                }
              }}
              dateDisplayFormat="MM/dd/yyyy"
              showDateDisplay={false}
              staticRanges={createStaticRanges()}
              inputRanges={[]}
              moveRangeOnFirstSelection={false}
              initialFocusedRange={[0, 1]}
              showMonthArrow={false}
              ranges={getRanges()}
              disabledDay={disabledDay}
              shownDate={getShownDate()}
              preview={preview}
              onPreviewChange={onPreviewChange}
            />
            <div styleName="calendar-footer">
              <button
                type="button"
                styleName="calendar-button"
                onClick={onReset}
              >
                Reset
              </button>
              <button
                type="button"
                styleName="calendar-button"
                onClick={() => {
                  setIsComponentVisible(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// It use https://www.npmjs.com/package/react-date-range internally
// Check the docs for further options

DateRangePicker.propTypes = {
  id: PropTypes.string,
  range: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

DateRangePicker.defaultProps = {
  id: "input-date-range-calendar-icon",
  placeholder: "Date range",
};

export default DateRangePicker;
