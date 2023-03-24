import * as applySelectors from "reducers/gigApply/selectors";
import * as detailsSelectors from "reducers/gigDetails/selectors";
import * as myGigsSelectors from "reducers/myGigsSelectors";
import { makeProfileUrl } from "./url";

/**
 * Creates a FormData object containing fields for job application.
 *
 * @param {Object} state root redux state
 * @returns {FormData}
 */
export function composeApplication(state) {
  const { email, firstName, handle, lastName } = myGigsSelectors.getProfile(
    state
  );
  const { duration, jobTimezone, title } = detailsSelectors.getDetails(state);
  const {
    agreedDuration,
    agreedTimezone,
    city,
    country,
    payment,
    phone,
    referral,
    resume,
    skills,
  } = applySelectors.getStateSlice(state);

  const formData = new FormData();
  if (resume.value) {
    formData.append("resume", resume.value);
  }

  const parts = [
    `${title} ->`,
    `Pay Expectation: ${payment.value}`,
    `Able to work during timezone? ${agreedTimezone.value ? jobTimezone : ""}`,
    `Am I ok to work the duration? ${agreedDuration.value ? duration : ""}`,
  ];
  const fields = {
    last_name: lastName,
    first_name: firstName,
    email: email,
    contact_number: phone.value,
    city: city.value,
    locality: country.value,
    salary_expectation: payment.value,
    skill:
      (skills.value && skills.value.map((skill) => skill.name).join(",")) ||
      null,
    custom_fields: [
      { field_id: 1, value: handle ? makeProfileUrl(handle) : "" },
      { field_id: 2, value: handle || "" },
      { field_id: 14, value: parts.join(",") },
    ],
  };
  if (referral.value) {
    fields.custom_fields.push({ field_id: 13, value: referral.value });
  }
  formData.append("form", JSON.stringify(fields));
  return formData;
}
