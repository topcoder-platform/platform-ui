import api from "./api";
import { RECRUIT_API_URL } from "../constants";

export const sendApplication = async (externalId, formData) => {
  const response = await api.post(
    `/${externalId}/apply`,
    formData,
    RECRUIT_API_URL,
  );

  if (response.status >= 300) {
    throw new Error("Failed to send gig application data.");
  }
  return response.json();
};
