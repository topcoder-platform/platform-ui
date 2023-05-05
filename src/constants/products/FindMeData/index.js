export const CHALLENGE_FIELD_VALUES = {
  trackId: "c0f5d461-8219-4c14-878a-c3a3f356466d",
  typeId: "927abff4-7af9-4145-8ba1-577c16e64e2e",
  timelineTemplateId: "7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c",
};

export const INTAKE_FORM_ROUTES = [
  "/self-service/wizard",
  "/self-service/new/find-me-data/basic-info",
  "/self-service",
  "/self-service",
  "/self-service/new/find-me-data/login-prompt",
  "/self-service",
  "/self-service/new/find-me-data/review",
  "/self-service/new/find-me-data/thank-you",
];

export const DEFAULT_TIMELINE = [
  {
    // Registration
    phaseId: "a93544bc-c165-4af4-b55e-18f3593b457a",
    duration: 259200, // 3 days
  },
  {
    // Submission
    phaseId: "6950164f-3c5e-4bdc-abc8-22aaf5a1bd49",
    duration: 259200, // 3 days
  },
  {
    // Review
    phaseId: "aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b",
    duration: 86400, // 1 day
  },
  {
    // Appeals
    phaseId: "1c24cfb3-5b0a-4dbd-b6bd-4b0dff5349c6",
    duration: 86400, // 1 day
  },
  {
    // Appeals response
    phaseId: "797a6af7-cd3f-4436-9fca-9679f773bee9",
    duration: 259200, // 3 days
  },
];

export const DEFAULT_DURATION = 8;

export const BASE_PRIZES_PAYMENT_BREAKDOWN = [0.2609, 0.2174, 0.1304];
export const BASE_REVIEWER_PAYMENT_BREAKDOWN = [0.0435, 0.0435];

export const PROMOTIONAL_PRIZES_PAYMENT_BREAKDOWN = [0.348, 0.29, 0.174];
export const PROMOTIONAL_REVIEWER_PAYMENT_BREAKDOWN = [0.058, 0.058];
