import {
  GIGS_SUBSCRIPTION_API_URL,
  GIGS_SUBSCRIPTION_GROUPS,
  GIGS_SUBSCRIPTION_LIST_ID,
} from "../../constants/gigsSubscription";

export const addGigsSubscription = (email) => {
  const controller = new AbortController();
  const promise = fetch(
    `${GIGS_SUBSCRIPTION_API_URL}/${GIGS_SUBSCRIPTION_LIST_ID}/members`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        interests: GIGS_SUBSCRIPTION_GROUPS,
      }),
      signal: controller.signal,
    }
  );
  return [promise, controller];
};

export const updateGigsSubscription = (email) => {
  const controller = new AbortController();
  const promise = fetch(
    `${GIGS_SUBSCRIPTION_API_URL}/${GIGS_SUBSCRIPTION_LIST_ID}/members/${email}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_address: email,
        status: "subscribed",
        interests: GIGS_SUBSCRIPTION_GROUPS,
      }),
      signal: controller.signal,
    }
  );
  return [promise, controller];
};
