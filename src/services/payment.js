import { CardNumberElement } from "@stripe/react-stripe-js";
import _ from "lodash";
import config from "../../config";
import { xhrPatchAsync, xhrPostAsync } from "../../src-ts";
import challengeService from "./challenge";

/**
 * Initiates payment process
 *
 * @param {string} stripe stripe object
 * @param {string} elements stripe elements
 * @param {string} amount payment amount
 * @param {string} currency payment currency
 * @param {string} challengeId challenge id
 *
 * @returns {Promise} promise
 */
export async function processPayment(
  stripe,
  elements,
  amount,
  challengeId,
  receiptEmail,
  description
) {
  // get project ID from challenge
  const challenge = await challengeService.getChallengeDetails(challengeId);

  try {
    // Call stripe api the create payment method, so the card info does not pass to our server.
    const payload = await stripe.createPaymentMethod({
      type: "card",
      card: elements.getElement(CardNumberElement),
    });

    // WARNING: this will fail until the API accepts cardName, country, email, and zipCode
    // until then, you can comment them out of the body, and it will work
    // please remove this comment after the api is updated
    const body = JSON.stringify({
      amount,
      currency: "USD",
      receiptEmail,
      paymentMethodId: payload.paymentMethod.id,
      reference: "project",
      referenceId: _.toString(challenge.projectId),
      description,
    });
    const url = `${config.API.V5}/customer-payments`;
    let response = await xhrPostAsync(url, body);

    const customerPayment = response.data;
    if (customerPayment.status === "requires_action") {
      await stripe.handleCardAction(customerPayment.clientSecret);
      response = await xhrPatchAsync(
        `${config.API.V5}/customer-payments/${customerPayment.id}/confirm`,
        JSON.stringify({})
      );
    }

    return response;
  } catch (e) {
    // TODO: Show error
    throw e;
  }
}
