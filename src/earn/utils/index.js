export * as auth from "./auth";
export * as challenge from "./challenge";
export * as icon from "./icon";
export * as tag from "./tag";
export * as url from "./url";
export * as pagination from "./pagination";

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

/* Return multiple selected dropdown options */
export function getSelectedDropdownOptions(options) {
  return options.filter((o) => o.selected);
}

/* Set single selected dropdown option */
export function setSelectedDropdownOption(options, selectedValue) {
  options.forEach((o) => (o.selected = false));

  const option = options.find((option) => option.label === selectedValue);
  if (option) {
    option.selected = true;
  }
}

/* Set multiple selected dropdown options */
export function setSelectedDropdownOptions(options, selectedValues) {
  options.forEach((o) => (o.selected = false));

  selectedValues.forEach((value) => {
    const option = options.find((option) => option.label === value);
    if (option) {
      option.selected = true;
    }
  });
}

export function createDropdownTermOptions(values, selectedValues) {
  return values.map((value) => ({
    label: `${value}`,
    selected: !!selectedValues && selectedValues.includes(value),
  }));
}

/* Return selected dropdown term options */
export function getSelectedDropdownTermsOptions(options) {
  return options.filter((o) => o.selected);
}

/* Set selected dropdown term options */
export function setSelectedDropdownTermOptions(
  options,
  selectedValues,
  caseSensitive = true
) {
  options.forEach((o) => (o.selected = false));

  selectedValues.forEach((value) => {
    const option = options.find((option) =>
      caseSensitive
        ? option.label === value
        : option.label.toLowerCase() === value.toLowerCase()
    );
    if (option) {
      option.selected = true;
    }
  });
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

export function getSortByLabel(SORT_BY, value) {
  const options = Object.keys(SORT_BY).filter((key) => SORT_BY[key] === value);
  if (options.length) {
    return options[0];
  }
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

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function formatTotalPrizes(n) {
  return n.toLocaleString("en-US");
}

export function parseTotalPrizes(s) {
  let val = s;
  if (val.endsWith("+")) {
    val = val.slice(0, -1);
  }
  let valid = val.replace(/[,0-9]/g, "") === "";
  let n;
  if (valid) {
    n = +val.replace(/,/g, "");
    if (/,/.test(val)) {
      valid = valid && n.toLocaleString("en-US") === val;
    }
  }
  return n;
}

export function triggerDownload(fileName, blob) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}

export function toBreakableWords(str, breakFunc) {
  return str
    .split(" ")
    .map((hyphenWords) => {
      return hyphenWords
        .split("-")
        .map((word) => {
          return breakFunc(word);
        })
        .join("-");
    })
    .join(" ");
}
