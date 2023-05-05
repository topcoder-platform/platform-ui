export const CHALLENGE_FIELD_VALUES = {
  trackId: "c0f5d461-8219-4c14-878a-c3a3f356466d",
  typeId: "927abff4-7af9-4145-8ba1-577c16e64e2e",
  timelineTemplateId: "7ebf1c69-f62f-4d3a-bdfb-fe9ddb56861c",
};

export const INTAKE_FORM_ROUTES = [
  "/self-service/wizard",
  "/self-service/new/data-advisory/basic-info",
  "/self-service",
  "/self-service",
  "/self-service/new/data-advisory/login-prompt",
  "/self-service",
  "/self-service/new/data-advisory/review",
  "/self-service/new/data-advisory/thank-you",
];

export const DEFAULT_TIMELINE = [
  {
    // Registration
    phaseId: "a93544bc-c165-4af4-b55e-18f3593b457a",
    duration: 259200,
  },
  {
    // Submission
    phaseId: "6950164f-3c5e-4bdc-abc8-22aaf5a1bd49",
    duration: 259200,
  },
  {
    // Review
    phaseId: "aa5a3f78-79e0-4bf7-93ff-b11e8f5b398b",
    duration: 86400,
  },
  {
    // Appeals
    phaseId: "1c24cfb3-5b0a-4dbd-b6bd-4b0dff5349c6",
    duration: 86400,
  },
  {
    // Appeals response
    phaseId: "797a6af7-cd3f-4436-9fca-9679f773bee9",
    duration: 259200,
  },
];

export const PRIZES_PAYMENT_BREAKDOWN = [0.375, 0.3125, 0.125];
export const REVIEWER_PAYMENT_BREAKDOWN = [0.0625, 0.0625];
export const DEFAULT_DURATION = 8;
