import {
  workPriceData,
  workPriceDesign,
  workPriceDesignLegacy,
  workPriceFindData,
  workPriceProblem,
} from '../../src-ts'
import * as dataExplorationConfigs from "../constants/products/DataExploration";
import * as findMeDataConfigs from "../constants/products/FindMeData";
import * as websiteDesignConfigs from "../constants/products/WebsiteDesign";
import * as dataAdvisoryConfigs from "../constants/products/DataAdvisory";
import * as websiteDesignLegacyConfigs from "../constants/products/WebsiteDesignLegacy";
import _ from "lodash";

/**
 * Scroll to top of page
 */
export function scrollToTop() {
  window.scrollTo(0, 0);
}

/**
 * Function used to sort objects that have "sortOrder" values.
 *
 * @param {Object} objA object A
 * @param {number} objA.sortOrder object A sort order
 * @param {Object} objB object B
 * @param {number} objB.sortOrder object B sort order
 * @returns {number}
 */
export function sortBySortOrder(objA, objB) {
  return objA.sortOrder - objB.sortOrder;
}

export function triggerDownload(fileName, blob) {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
}

/**
 * Pad a number with leading zeros.
 */
export function padStart(target, targetLength = 2) {
  if (target === 0) {
    return target;
  }

  return String.prototype.padStart.call(target, targetLength, "0");
}

export function getDataAdvisoryPriceAndTimelineEstimate() {
  const total = workPriceProblem.getPrice(workPriceProblem);
  return {
    total,
    stickerPrice: workPriceProblem.packages?.base?.price,
    submissionDuration: 3,
    totalDuration: dataAdvisoryConfigs.DEFAULT_DURATION,
    prizeSets: [
      {
        prizes: [
          ..._.map(dataAdvisoryConfigs.PRIZES_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Challenge Prizes",
        type: "placement",
      },
      {
        prizes: [
          ..._.map(dataAdvisoryConfigs.REVIEWER_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Reviewer Payment",
        type: "reviewer",
      },
    ],
  };
}

export function getDataExplorationPriceAndTimelineEstimate() {
  const total = workPriceData.getPrice(workPriceData)
  return {
    total,
    stickerPrice: workPriceData.packages?.base?.price,
    submissionDuration: 3,
    totalDuration: dataExplorationConfigs.DEFAULT_DURATION,
    prizeSets: [
      {
        prizes: [
          ..._.map(dataExplorationConfigs.PRIZES_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Challenge Prizes",
        type: "placement",
      },
      {
        prizes: [
          ..._.map(dataExplorationConfigs.REVIEWER_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Reviewer Payment",
        type: "reviewer",
      },
    ],
  };
}

export function getWebsiteDesignPriceAndTimelineEstimate() {
  const total = workPriceDesign.getPrice(workPriceDesign);
  return {
    total,
    // stickerPrice: workPriceDesign.packages?.base?.price,
    submissionDuration: 4,
    totalDuration: websiteDesignConfigs.DEFAULT_DURATION,
    prizeSets: [
      {
        prizes: [
          ..._.map(websiteDesignConfigs.PRIZES_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Challenge Prizes",
        type: "placement",
      },
      {
        prizes: [
          ..._.map(websiteDesignConfigs.REVIEWER_PAYMENT_BREAKDOWN, (p) => ({
            type: "USD",
            value: _.round(p * total),
          })),
        ],
        description: "Reviewer Payment",
        type: "reviewer",
      },
    ],
  };
}

export function getFindMeDataPriceAndTimelineEstimate() {

  const total = workPriceFindData.getPrice(workPriceFindData);

  const placementPercentages = workPriceFindData.usePromo
    ? findMeDataConfigs.PROMOTIONAL_PRIZES_PAYMENT_BREAKDOWN
    : findMeDataConfigs.BASE_PRIZES_PAYMENT_BREAKDOWN;
  const reviewerPercentages = workPriceFindData.usePromo
    ? findMeDataConfigs.PROMOTIONAL_REVIEWER_PAYMENT_BREAKDOWN
    : findMeDataConfigs.BASE_REVIEWER_PAYMENT_BREAKDOWN;

  return {
    total,
    stickerPrice: workPriceFindData.packages?.base?.price,
    submissionDuration: 3,
    totalDuration: findMeDataConfigs.DEFAULT_DURATION,
    prizeSets: [
      {
        prizes: placementPercentages.map((percentage) => ({
          type: "USD",
          value: _.round(percentage * total),
        })),
        description: "Challenge Prizes",
        type: "placement",
      },
      {
        prizes: reviewerPercentages.map((percentage) => ({
          type: "USD",
          value: _.round(percentage * total),
        })),
        description: "Reviewer Payment",
        type: "reviewer",
      },
    ],
  };
}

export function getDynamicPriceAndTimelineEstimate(formData) {
  const numOfPages = formData?.form?.pageDetails?.pages?.length || 1
  const numOfDevices = formData?.form?.basicInfo?.selectedDevice.option.length || 1
  return getDynamicPriceAndTimeline(numOfPages, numOfDevices);
}

/**
 * Get dynamic price
 * @param {Number} pages the number of pages
 * @param {Number} devices the number of devices
 */
export function getDynamicPriceAndTimeline(pages, devices) {

  const total = workPriceDesignLegacy.getPrice(workPriceDesignLegacy, pages, devices);

  const pricing = {
    total,
    stickerPrice: total * 2,
    ...websiteDesignLegacyConfigs.DURATION_MAPPING[pages - 1][devices - 1],
    costPerAdditionalPage: devices * websiteDesignLegacyConfigs.PER_PAGE_COST,
    prizeSets: [
      {
        prizes: [
          ..._.map(
            websiteDesignLegacyConfigs.PRIZES_PAYMENT_BREAKDOWN,
            (p) => ({
              type: "USD",
              value: _.round(p * total),
            })
          ),
        ],
        description: "Challenge Prizes",
        type: "placement",
      },
      {
        prizes: [
          ..._.map(
            websiteDesignLegacyConfigs.REVIEWER_PAYMENT_BREAKDOWN,
            (p) => ({
              type: "USD",
              value: _.round(p * total),
            })
          ),
        ],
        description: "Reviewer Payment",
        type: "reviewer",
      },
    ],
  };

  return pricing;
}

/**
 * Format number to currency
 * @param {Number} num number
 * @returns the formated string
 */
export function currencyFormat(num) {
  return "$" + _.toString(num).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}
