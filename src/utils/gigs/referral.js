import cookies from "browser-cookies";
import { makeGigReferralUrl } from "./url";

/**
 * Creates an object that can be used to send referral email.
 *
 * @param {Object} params
 * @param {string} params.email recipient's email address
 * @param {Object} params.profile profile object
 * @param {string} params.externalId gig external id
 * @param {string} params.referralId user's referral id
 * @returns {Object}
 */
export const composeReferralEmail = ({
  email,
  profile,
  externalId,
  referralId,
}) => ({
  personalizations: [
    {
      to: [{ email }],
      subject: `${profile.firstName} ${profile.lastName} Thinks This Topcoder Gig Is For You!`,
    },
  ],
  from: {
    email: "noreply@topcoder.com",
    name: `${profile.firstName} ${profile.lastName} via Topcoder Gigwork`,
  },
  content: [
    {
      type: "text/plain",
      value: `Hey there!

Topcoder has a freelance gig that I thought you would be interested in. If you get the gig, I could earn cash!

Check it out:
${makeGigReferralUrl(externalId, referralId)}`,
    },
  ],
});

export const getHostDomain = () => {
  let hostDomain = "";
  if (window.location.hostname !== "localhost") {
    hostDomain =
      "." +
      window.location.hostname.split(".").reverse()[1] +
      "." +
      window.location.hostname.split(".").reverse()[0];
  }
  return hostDomain;
};

/**
 * Sets the cookie with referral id.
 */
export const setReferralCookie = () => {
  const params = new URLSearchParams(window.location.search);
  const referralId = params.get("referralId");
  if (referralId) {
    cookies.set(process.env.GROWSURF_COOKIE, JSON.stringify({ referralId }), {
      ...process.env.GROWSURF_COOKIE_SETTINGS,
      domain: getHostDomain(),
    });
  }
};

/**
 * Clear the cookie
 */
export const clearReferralCookie = () => {
  cookies.set(process.env.GROWSURF_COOKIE, "", {
    maxAge: 0,
    domain: getHostDomain(),
    overwrite: true,
  });
};

/**
 * Set applied Storage
 */
export const setAppliedStorage = (id) => {
  let ids = localStorage.getItem(process.env.APPLIED_GIGS) || "";
  let index = ids.indexOf(id);
  // Already cached the gig ID
  if (index >= 0) return;
  ids += (ids === "" ? "" : ",") + `${id}`;
  localStorage.setItem(process.env.APPLIED_GIGS, ids);
};

/**
 * Remove cached gig Id from Storage
 */
export const removeAppliedStorage = (id) => {
  let ids = localStorage.getItem(process.env.APPLIED_GIGS) || "";
  ids = ids.split(",");
  let index = ids.indexOf(id);
  // the gig ID doesn't exist in local cache
  if (index < 0) return;
  ids.splice(index, 1);
  localStorage.setItem(process.env.APPLIED_GIGS, ids.join(","));
};

/**
 * Get applied Cookie
 */
export const getAppliedStorage = () => {
  return localStorage.getItem(process.env.APPLIED_GIGS) || "";
};
