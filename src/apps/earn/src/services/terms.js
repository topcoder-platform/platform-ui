/**
 * @module "services.terms"
 * @desc This module provides a service for convenient manipulation with
 * Topcoder challenges' terms via TC API.
 */

import _ from "lodash";

import config from "../config";

import { getService as getChallengeService } from "./challenges";
import { getApi } from "./challenge-api";

/**
 * Service class.
 */
class TermsService {
  /**
   * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
   */
  constructor(tokenV3) {
    this.private = {
      api: getApi("V5", tokenV3),
      tokenV3,
    };
  }

  /**
   * get all terms of specified challenge
   * @param  {Array<String>} terms terms of the challenge
   * @return {Promise}       promise of the request result
   */
  async getChallengeTerms(terms) {
    const challengeService = getChallengeService(this.private.tokenV3);
    const roleId = await challengeService.getRoleId("Submitter");
    const registerTerms = _.filter(terms, (t) => t.roleId === roleId);

    return Promise.all(
      _.map(registerTerms, (term) => this.getTermDetails(term.id))
    ).then((challengeTerms) =>
      _.map(challengeTerms, (term) => _.pick(term, "id", "title", "agreed"))
    );
  }

  /**
   * Get the terms for Review Opportunities.  This will ensure that the
   * provided terms have all the necessary fields by getting anything missing
   * from the terms details endpoint
   *
   * @param {Object} requiredTerms Required terms for review opportunity
   *
   * @return {Promise} resolves to the list of validated terms
   */
  getReviewOpportunityTerms(requiredTerms) {
    const promises = requiredTerms.map((term) => {
      // Agreed field is present, all the necessary information is present for this term, but will
      // need to verify if agreed is false as user may have agreed to terms after data was loaded
      if (term.agreed) {
        return Promise.resolve(term);
      }
      // Otherwise grab new details from terms api
      return this.getTermDetails(term.id).then((res) =>
        _.pick(res, ["id", "agreed", "title"])
      );
    });

    return Promise.all(promises).then((terms) => terms);
  }

  /**
   * get details of specified term
   * @param  {Number|String} termId id of the term
   * @return {Promise}       promise of the request result
   */
  async getTermDetails(termId) {
    let termDetails = {};
    let isLegacyTerm = false;
    if (/^[\d]{5,8}$/.test(termId)) {
      isLegacyTerm = true;
      termDetails = await this.private.api
        .get(`/terms?legacyId=${termId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.json())))
        .then((res) =>
          res.result ? res.result[0] : Promise.reject(res.json())
        );
    } else {
      termDetails = await this.private.api
        .get(`/terms/${termId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.json())));
    }
    return {
      ...termDetails,
      isLegacyTerm,
    };
  }

  /**
   * generate the url of DocuSign term
   * @param  {Number|String} templateId id of the term's template
   * @param  {String}        returnUrl  callback url after finishing signing
   * @return {Promise}       promise of the request result
   */
  getDocuSignUrl(templateId, returnUrl) {
    const params = {
      templateId,
      returnUrl,
    };
    return this.private.api
      .postJson("/terms/docusignViewURL", params)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.json())));
  }

  /**
   * Agree a term
   * @param  {Number|String} termId id of the term
   * @return {Promise}       promise of the request result
   */
  agreeTerm(termId) {
    return this.private.api
      .post(`/terms/${termId}/agree`)
      .then((res) => (res.ok ? res.json() : Promise.reject(res.json())));
  }
}

let lastInstance = null;
/**
 * Returns a new or existing terms service.
 * @param {String} tokenV3 Optional. Auth token for Topcoder API v3.
 * @return {TermsService} Terms service object
 */
export function getService(tokenV3) {
  /* Because of Topcoder backend restrictions, it is not straightforward to test
   * terms-related functionality in any other way than just providing an option
   * to run the app against mock terms service. */
  if (config.MOCK_TERMS_SERVICE) {
    /* eslint-disable global-require */
    return require("./__mocks__/terms").getService(tokenV3);
    /* eslint-enable global-require */
  }
  if (!lastInstance || (tokenV3 && lastInstance.private.tokenV3 !== tokenV3)) {
    lastInstance = new TermsService(tokenV3);
  }
  return lastInstance;
}

/* Using default export would be confusing in this case. */
export default undefined;
