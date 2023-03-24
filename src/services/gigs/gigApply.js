import { getAuthUserTokens } from "@topcoder/mfe-header";
import { RECRUIT_API_URL } from "constants/urls";

export const sendApplication = async (externalId, formData) => {
  const { tokenV3 } = await getAuthUserTokens();
  const response = await fetch(`${RECRUIT_API_URL}/${externalId}/apply`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${tokenV3}` },
    body: formData,
  });
  if (response.status >= 300) {
    throw new Error("Failed to send gig application data.");
  }
  return response.json();
};
