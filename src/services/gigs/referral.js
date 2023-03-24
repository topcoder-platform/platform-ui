import { composeReferralEmail } from "../../utils/gigs/referral";
import { REFERRAL_API_URL } from "../../constants/urls";

/**
 * Fetches referral data for specific email.
 *
 * @param {string} email email to fetch the data for
 * @returns {Promise}
 */
export const fetchEmailData = (email) => {
  return fetch(`${REFERRAL_API_URL}/growsurf/participant/${email}`).then(
    (response) => {
      if (response.status >= 300) {
        throw new Error("Failed to fetch referral email data.");
      }
      return response.json();
    }
  );
};

/**
 * Fetches referral data using properties from user profile object.
 *
 * @param {Object} profile profile object
 * @returns {Promise}
 */
export const fetchReferralData = async ({
  email,
  firstName,
  lastName,
  handle,
}) => {
  //TODO: Fix uninav login token processing
  const tokens = null;
  return fetch(
    `${REFERRAL_API_URL}/growsurf/participants?participantId=${email}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.tokenV3}`,
      },
      body: JSON.stringify({ email, firstName, lastName, tcHandle: handle }),
    }
  ).then((response) => {
    if (response.status >= 300) {
      throw new Error("Failed to fetch referral data");
    }
    return response.json();
  });
};

/**
 * Sends a referral email using provided parameters.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {Object} params.profile
 * @param {string} params.externalId
 * @param {string} params.referralId
 * @returns {Promise}
 */
export const sendReferralEmail = (emailParams) => {
  return fetch(`${REFERRAL_API_URL}/mailchimp/email`, {
    method: "POST",
    body: JSON.stringify(composeReferralEmail(emailParams)),
    headers: { "Content-Type": "application/json" },
    redirect: "follow",
  }).then((response) => {
    if (response.status >= 300) {
      throw new Error("Failed to send referral email.");
    }
    return response.json();
  });
};

/**
 * Updates referral data.
 *
 * @param {Object} referralData
 * @returns {Promise}
 */
export const updateReferralData = async (referralData) => {
  //TODO: Fix uni nav auth token retrieval
  const tokens = null;
  const response = await fetch(
    `${REFERRAL_API_URL}/growsurf/participant/${referralData.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.tokenV3}`,
      },
      body: JSON.stringify(referralData),
    }
  );
  if (response.status >= 300) {
    throw new Error("Failed to update referral data.");
  }
  return await response.json();
};
