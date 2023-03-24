import { handleActions } from "redux-actions";
import * as ACTION_TYPE from "../../../actions/gigs/gigApply/types";
import { isValidIntegerString } from "../../../utils/gigs/misc";
import {
  addInvalidField,
  checkField,
  removeInvalidField,
  touchField,
  validateEmpty,
  validateLength,
} from "./misc";
import { MAX_RESUME_FILE_SIZE_MB } from "../../../constants";

const initState = () => ({
  application: {
    data: null,
    error: null,
    isSending: false,
  },
  invalidFields: [
    new Set([
      "agreedDuration",
      "agreedTerms",
      "agreedTimezone",
      "city",
      "country",
      "phone",
      "payment",
      "resume",
      "skills",
    ]),
  ],
  agreedDuration: {
    isRequired: true,
    error: null,
    value: false,
  },
  agreedTerms: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: false,
  },
  agreedTimezone: {
    isRequired: true,
    error: null,
    value: false,
  },
  city: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
  country: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
  payment: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
  phone: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
  referral: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
  resume: {
    isRequired: true,
    error: null,
    value: null,
  },
  skills: {
    isRequired: true,
    isTouched: false,
    error: null,
    value: null,
  },
});

const onInitProfileData = (
  state,
  { payload: { country, profile, skills } }
) => {
  const {
    city = null,
    existingResume = null,
    phone = null,
    salaryExpectation = null,
  } = profile;
  return {
    ...state,
    city: {
      ...state.city,
      value: city ? city : null,
    },
    country: {
      ...state.country,
      value: country ? country : null,
    },
    payment: {
      ...state.payment,
      value: salaryExpectation,
    },
    phone: {
      ...state.phone,
      value: phone,
    },
    resume: {
      ...state.resume,
      isRequired: !existingResume,
    },
    skills: {
      ...state.skills,
      value: skills,
    },
  };
};

const onResetApplication = (state) => ({
  ...state,
  application: {
    data: null,
    error: null,
    isSending: false,
  },
});

const onResetForm = initState;

const onSendApplicationError = (state, { payload: error }) => ({
  ...state,
  application: {
    ...state.application,
    isSending: false,
    error,
  },
});

const onSendApplicationPending = (state) => ({
  ...state,
  application: {
    ...state.application,
    isSending: true,
    error: null,
  },
});

const onSendApplicationSuccess = (state, { payload: data }) => ({
  ...state,
  application: {
    ...state.application,
    isSending: false,
    data,
  },
});

const onSetAgreedDuration = (state, { payload = "" }) => {
  let value = payload.toLowerCase() === "yes";
  return checkField("agreedDuration", {
    ...state,
    agreedDuration: {
      ...state.agreedDuration,
      error: value
        ? null
        : "Sorry, we are only looking for candidates that can work the hours and duration listed",
      value,
    },
  });
};

const onSetAgreedTerms = (state, { payload: value }) => {
  return checkField("agreedTerms", {
    ...state,
    agreedTerms: {
      ...state.agreedTerms,
      error: value ? null : "Please, accept our terms",
      value,
    },
  });
};

const onSetAgreedTimezone = (state, { payload = "" }) => {
  let value = payload.toLowerCase() === "yes";
  return checkField("agreedTimezone", {
    ...state,
    agreedTimezone: {
      ...state.agreedTimezone,
      error: value
        ? null
        : "Sorry, we are only looking for candidates that can work the hours and duration listed",
      value,
    },
  });
};

const onSetCity = (state, { payload: value }) => {
  if (value === state.city.value) {
    return state;
  }
  return {
    ...state,
    invalidFields: addInvalidField(state.invalidFields, "city"),
    city: {
      ...state.city,
      error: null,
      value,
    },
  };
};

const onSetCountry = (state, { payload: value }) => {
  if (value === state.country.value) {
    return state;
  }
  return {
    ...state,
    // Once the field has a non-empty value the user is unable to set it back
    // to empty value so the field becomes valid.
    invalidFields: removeInvalidField(state.invalidFields, "country"),
    country: {
      ...state.country,
      error: null,
      value,
    },
  };
};

const onSetPayment = (state, { payload: value }) => {
  if (value === state.payment.value) {
    return state;
  }
  return {
    ...state,
    invalidFields: addInvalidField(state.invalidFields, "payment"),
    payment: {
      ...state.payment,
      error: null,
      value,
    },
  };
};

const onSetPhone = (state, { payload: value }) => {
  if (value === state.phone.value) {
    return state;
  }
  return {
    ...state,
    invalidFields: addInvalidField(state.invalidFields, "phone"),
    phone: {
      ...state.phone,
      error: null,
      value,
    },
  };
};

const onSetReferral = (state, { payload: value }) => {
  if (value === state.referral.value) {
    return state;
  }
  return {
    ...state,
    // Once the field has a non-empty value the user is unable to set it back
    // to empty value so the field becomes valid.
    invalidFields: removeInvalidField(state.invalidFields, "referral"),
    referral: {
      error: null,
      value,
    },
  };
};

const onSetResume = (state, { payload: value }) => {
  return {
    ...state,
    invalidFields: addInvalidField(state.invalidFields, "resume"),
    resume: {
      ...state.resume,
      error: null,
      value,
    },
  };
};

const onSetSkills = (state, { payload: value }) => {
  return {
    ...state,
    invalidFields: addInvalidField(state.invalidFields, "skills"),
    skills: {
      ...state.skills,
      error: null,
      value,
    },
  };
};

const onTouchAgreedDuration = (state) => touchField(state, "agreedDuration");

const onTouchAgreedTerms = (state) => touchField(state, "agreedTerms");

const onTouchAgreedTimezone = (state) => touchField(state, "agreedTimezone");

const onTouchCity = (state) => touchField(state, "city");

const onTouchPayment = (state) => touchField(state, "payment");

const onTouchPhone = (state) => touchField(state, "phone");

const onTouchResume = (state) => touchField(state, "resume");

const onTouchSkills = (state) => touchField(state, "skills");

const onTouchReferral = (state) => touchField(state, "referral");

const onValidateAgreedDuration = (state) => {
  const agreedDuration = state.agreedDuration;
  let error = null;
  if (!agreedDuration.value) {
    error = "Required field";
  }
  return checkField("agreedDuration", {
    ...state,
    agreedDuration: { ...agreedDuration, error },
  });
};

const onValidateAgreedTerms = (state) => {
  const agreedTerms = state.agreedTerms;
  let error = null;
  if (!agreedTerms.value) {
    error = "Please, agree to our terms";
  }
  return checkField("agreedTerms", {
    ...state,
    agreedTerms: { ...agreedTerms, error },
  });
};

const onValidateAgreedTimezone = (state) => {
  const agreedTimezone = state.agreedTimezone;
  let error = null;
  if (!agreedTimezone.value) {
    error = "Required field";
  }
  return checkField("agreedTimezone", {
    ...state,
    agreedTimezone: { ...agreedTimezone, error },
  });
};

const onValidateCity = (state) => {
  const city = state.city;
  let error = validateEmpty(city);
  if (error) {
    return checkField("city", { ...state, city: { ...city, error } });
  }
  error = validateLength(city, 2, 50);
  return checkField("city", { ...state, city: { ...city, error } });
};

const onValidateCountry = (state) => {
  const country = state.country;
  let error = null;
  if (!country.value) {
    error = "Required field";
  }
  return checkField("country", { ...state, country: { ...country, error } });
};

const onValidatePayment = (state) => {
  const payment = state.payment;
  const value = payment.value;
  let error = null;
  if (value) {
    if (!isValidIntegerString(value)) {
      error = "Must be integer value in $";
    }
  } else if (payment.isRequired) {
    error = "Required field";
  }
  return checkField("payment", { ...state, payment: { ...payment, error } });
};

const onValidatePhone = (state) => {
  const phone = state.phone;
  let error = validateEmpty(phone);
  if (error) {
    return checkField("phone", { ...state, phone: { ...phone, error } });
  }
  error = validateLength(phone, 2, 50);
  return checkField("phone", { ...state, phone: { ...phone, error } });
};

const onValidateResume = (state) => {
  let doDelete = false;
  let error = null;
  const resume = state.resume;
  if (resume.value) {
    if (resume.value.size / 2 ** 20 > MAX_RESUME_FILE_SIZE_MB) {
      doDelete = true;
      error = `Max file size is limited to ${MAX_RESUME_FILE_SIZE_MB} MB`;
    } else {
      let filename = resume.value.name;
      if (!filename.endsWith(".pdf") && !filename.endsWith(".docx")) {
        error = "Only .pdf and .docx files are allowed";
      }
    }
  } else if (resume.isRequired) {
    error = "Please, pick your CV file for uploading";
  }
  return checkField("resume", {
    ...state,
    resume: { ...resume, error, value: doDelete ? null : resume.value },
  });
};

const onValidateSkills = (state) => {
  const skills = state.skills;
  const skillsValue = skills.value;
  let error = null;
  if (!skillsValue || !skillsValue.length) {
    error = "Please, add technical skills";
  } else {
    let names = [];
    for (let skill of skillsValue) {
      names.push(skill.name);
    }
    if (names.join(",").length >= 100) {
      error = "Sum of all skill characters may not be greater than 100";
    }
  }
  return checkField("skills", { ...state, skills: { ...skills, error } });
};

const onValidateReferral = (state) => {
  const referral = state.referral;
  let error = null;
  if (!referral.value) {
    error = "Required field";
  }
  return checkField("referral", { ...state, referral: { ...referral, error } });
};

const onValidateUntouched = (state) => {
  for (let name in FIELD_VALIDATORS) {
    let field = state[name];
    if (field.isTouched) {
      continue;
    }
    state = FIELD_VALIDATORS[name](state);
  }
  return state;
};

const FIELD_VALIDATORS = {
  agreedDuration: onValidateAgreedDuration,
  agreedTerms: onValidateAgreedTerms,
  agreedTimezone: onValidateAgreedTimezone,
  city: onValidateCity,
  country: onValidateCountry,
  payment: onValidatePayment,
  phone: onValidatePhone,
  resume: onValidateResume,
  skills: onValidateSkills,
  referral: onValidateReferral,
};

const initialState = initState();

export default handleActions(
  {
    [ACTION_TYPE.INIT_PROFILE_DATA]: onInitProfileData,
    [ACTION_TYPE.RESET_APPLICATION]: onResetApplication,
    [ACTION_TYPE.RESET_FORM]: onResetForm,
    [ACTION_TYPE.SEND_APPLICATION_ERROR]: onSendApplicationError,
    [ACTION_TYPE.SEND_APPLICATION_PENDING]: onSendApplicationPending,
    [ACTION_TYPE.SEND_APPLICATION_SUCCESS]: onSendApplicationSuccess,
    [ACTION_TYPE.SET_AGREED_DURATION]: onSetAgreedDuration,
    [ACTION_TYPE.SET_AGREED_TERMS]: onSetAgreedTerms,
    [ACTION_TYPE.SET_AGREED_TIMEZONE]: onSetAgreedTimezone,
    [ACTION_TYPE.SET_CITY]: onSetCity,
    [ACTION_TYPE.SET_COUNTRY]: onSetCountry,
    [ACTION_TYPE.SET_PAYMENT]: onSetPayment,
    [ACTION_TYPE.SET_PHONE]: onSetPhone,
    [ACTION_TYPE.SET_REFERRAL]: onSetReferral,
    [ACTION_TYPE.SET_RESUME]: onSetResume,
    [ACTION_TYPE.SET_SKILLS]: onSetSkills,
    [ACTION_TYPE.TOUCH_AGREED_DURATION]: onTouchAgreedDuration,
    [ACTION_TYPE.TOUCH_AGREED_TERMS]: onTouchAgreedTerms,
    [ACTION_TYPE.TOUCH_AGREED_TIMEZONE]: onTouchAgreedTimezone,
    [ACTION_TYPE.TOUCH_CITY]: onTouchCity,
    [ACTION_TYPE.TOUCH_PAYMENT]: onTouchPayment,
    [ACTION_TYPE.TOUCH_PHONE]: onTouchPhone,
    [ACTION_TYPE.TOUCH_RESUME]: onTouchResume,
    [ACTION_TYPE.TOUCH_SKILLS]: onTouchSkills,
    [ACTION_TYPE.TOUCH_REFERRAL]: onTouchReferral,
    [ACTION_TYPE.VALIDATE_CITY]: onValidateCity,
    [ACTION_TYPE.VALIDATE_COUNTRY]: onValidateCountry,
    [ACTION_TYPE.VALIDATE_PAYMENT]: onValidatePayment,
    [ACTION_TYPE.VALIDATE_PHONE]: onValidatePhone,
    [ACTION_TYPE.VALIDATE_RESUME]: onValidateResume,
    [ACTION_TYPE.VALIDATE_SKILLS]: onValidateSkills,
    [ACTION_TYPE.VALIDATE_REFERRAL]: onValidateReferral,
    [ACTION_TYPE.VALIDATE_UNTOUCHED]: onValidateUntouched,
  },
  initialState,
  { prefix: "GIG-APPLY", namespace: "--" }
);
