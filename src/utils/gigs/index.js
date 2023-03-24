export * as auth from "./auth";
export * as icon from "./icon";
export * as url from "./url";
export * as pagination from "./pagination";
export * as myGig from "./myGig";

export function createDropdownOptions(values, selectedValue) {
  return values.map((value) => ({
    label: `${value}`,
    selected:
      !!selectedValue &&
      (selectedValue === value ||
        (selectedValue.name && selectedValue.name === value)),
  }));
}

/* Return single selected dropdown option*/
export function getSelectedDropdownOption(options) {
  return options.find((o) => o.selected);
}

/* Set single selected dropdown option */
export function setSelectedDropdownOption(options, selectedValue) {
  options.forEach((o) => (o.selected = false));

  const option = options.find((option) => option.label === selectedValue);
  if (option) {
    option.selected = true;
  }
}

/**
 * Return an array of options.
 *
 * @param values {Array<String>} Input values
 * @param selectedValue {String} Selected value
 * @return {Array<{label: String, value: Boolean}>} Radio options
 */
export function createRadioOptions(values, selectedValue) {
  return values.map((value) => ({
    label: `${value}`,
    value: selectedValue && selectedValue === value,
  }));
}

export function getSelectedRadioOption(options) {
  return options.find((o) => o.value);
}

/**
 * Set the option of `selectedValue` as checked.
 *
 * @param options {Array<{label: String, value: Boolean}>} Radio options
 * @param selectedValue {String} Selected option label.
 */
export function setSelectedRadioOption(options, selectedValue) {
  options.forEach((o) => (o.value = false));

  const option = options.find((option) => option.label === selectedValue);
  if (option) {
    option.value = true;
  }
}

/**
 * Format a number value into the integer text of money value.
 * Ex: 1800 -> $1,800
 */
export function formatMoneyValue(value, symbol) {
  if (typeof value !== "number") {
    return value || "";
  }

  const SYMBOL = symbol || "";
  let val = value;
  val = val.toLocaleString("en-US");

  const i = val.indexOf(".");
  if (i !== -1) {
    val = val.slice(0, i);
  }

  if (val.startsWith("-")) {
    val = `-${SYMBOL}${val.slice(1)}`;
  } else {
    val = `${SYMBOL}${val}`;
  }

  return val;
}
