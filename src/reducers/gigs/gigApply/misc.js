export function checkField(fieldName, state) {
  const field = state[fieldName];
  state.invalidFields = field.error
    ? addInvalidField(state.invalidFields, fieldName)
    : removeInvalidField(state.invalidFields, fieldName);
  return state;
}

/**
 * Returns an array with one Set object. The Set object contains all invalid
 * field names.
 *
 * @param {Array} invalidFields array with one Set element
 * @param {string} name field name
 * @returns {Array} possibly new array with old Set element
 */
export function addInvalidField(invalidFields, name) {
  let invalidFieldsSet = invalidFields[0];
  let invalidCount = invalidFieldsSet.size;
  invalidFieldsSet.add(name);
  return invalidFieldsSet.size === invalidCount
    ? invalidFields
    : [invalidFieldsSet];
}

export function removeInvalidField(invalidFields, name) {
  let invalidFieldsSet = invalidFields[0];
  let invalidCount = invalidFieldsSet.size;
  invalidFieldsSet.delete(name);
  return invalidFieldsSet.size === invalidCount
    ? invalidFields
    : [invalidFieldsSet];
}

export function validateEmpty(field, error = "Required field") {
  return !field.isRequired || field.value ? null : error;
}

export function validateLength(field, min = 2, max = 40) {
  let value = field.value;
  return !value || value.length < min
    ? `Must be at least ${min} characters`
    : value.length > max
    ? `Must be max ${max} characters`
    : null;
}

export function touchField(state, fieldName) {
  const field = state[fieldName];
  if (field.isTouched) {
    return state;
  }
  return {
    ...state,
    [fieldName]: {
      ...field,
      isTouched: true,
    },
  };
}
