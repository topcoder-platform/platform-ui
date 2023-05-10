import { EnvironmentConfig } from "~/config";
import { xhrPostAsync } from "~/libs/core";

/**
 * Submit work to challenge API
 * TODO: Integrate with real api
 */
export async function submitWork(form) {}

/**
 * Create support ticket
 * @param {Object} request challenge id
 * @param {String} challengeId challenge id
 * @param {Boolean} isSelfService indicates if the challenge is self-service or not
 */
export async function createSupportTicket(request, challengeId, isSelfService) {
  const supportRequest = {
    ...request,
    challengeId,
    isSelfService: true, // TODO: clean up. Should always be true
  };
  const body = JSON.stringify(supportRequest);
  const url = `${EnvironmentConfig.API.V5}/challenges/support-requests`;
  const response = await xhrPostAsync(url, body);
  return response;
}
