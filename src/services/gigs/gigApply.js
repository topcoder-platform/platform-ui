import { tokenGetAsync } from "../../../src-ts/lib/functions/token-functions/"
import { RECRUIT_API_URL } from "../../constants/urls";

export const sendApplication = async (externalId, formData) => {
  const user = await tokenGetAsync();
  const response = await fetch(`${RECRUIT_API_URL}/${externalId}/apply`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${user?.token}` },
    body: formData,
  });
  if (response.status >= 300) {
    throw new Error("Failed to send gig application data.");
  }
  return response.json();
};
